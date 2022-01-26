package main // must be main for plugin entry point

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/merico-dev/lake/config"
	"github.com/merico-dev/lake/logger" // A pseudo type for Plugin Interface implementation
	lakeModels "github.com/merico-dev/lake/models"
	"github.com/merico-dev/lake/plugins/core"
	"github.com/merico-dev/lake/plugins/github/api"
	"github.com/merico-dev/lake/plugins/github/models"
	"github.com/merico-dev/lake/plugins/github/tasks"
	"github.com/merico-dev/lake/utils"
	"github.com/mitchellh/mapstructure"
)

var _ core.Plugin = (*Github)(nil)

type GithubOptions struct {
	Tasks []string
}
type Github string

func (plugin Github) Init() {
	logger.Info("INFO >>> init GitHub plugin", true)
	err := lakeModels.Db.AutoMigrate(
		&models.GithubRepository{},
		&models.GithubCommit{},
		&models.GithubRepoCommit{},
		&models.GithubPullRequest{},
		&models.GithubReviewer{},
		&models.GithubPullRequestComment{},
		&models.GithubPullRequestCommit{},
		&models.GithubIssue{},
		&models.GithubIssueComment{},
		&models.GithubIssueEvent{},
		&models.GithubIssueLabel{},
		&models.GithubUser{},
	)
	if err != nil {
		logger.Error("Error migrating github: ", err)
		panic(err)
	}
}

func (plugin Github) Description() string {
	return "To collect and enrich data from GitHub"
}

func (plugin Github) Execute(options map[string]interface{}, progress chan<- float32, ctx context.Context) error {
	endpoint := config.V.GetString("GITHUB_ENDPOINT")
	configTokensString := config.V.GetString("GITHUB_AUTH")
	tokens := strings.Split(configTokensString, ",")
	githubApiClient := tasks.CreateApiClient(endpoint, tokens)
	_ = githubApiClient.SetProxy(config.V.GetString("GITHUB_PROXY"))

	tokenCount := len(tokens)

	if tokenCount == 0 {
		return fmt.Errorf("owner is required for GitHub execution")
	}

	rateLimitPerSecondInt, err := core.GetRateLimitPerSecond(options, tokenCount)
	if err != nil {
		return err
	}
	scheduler, err := utils.NewWorkerScheduler(50, rateLimitPerSecondInt, ctx)
	if err != nil {
		logger.Error("could not create scheduler", false)
	}

	defer scheduler.Release()

	logger.Print("start github plugin execution")

	owner, ok := options["owner"]
	if !ok {
		return fmt.Errorf("owner is required for GitHub execution")
	}
	ownerString := owner.(string)

	repositoryName, ok := options["repositoryName"]
	if !ok {
		return fmt.Errorf("repositoryName is required for GitHub execution")
	}
	repositoryNameString := repositoryName.(string)

	var op GithubOptions
	err = mapstructure.Decode(options, &op)
	if err != nil {
		return err
	}
	tasksToRun := make(map[string]bool, len(op.Tasks))
	for _, task := range op.Tasks {
		tasksToRun[task] = true
	}
	if len(tasksToRun) == 0 {
		tasksToRun = map[string]bool{
			"collectRepo":                true,
			"collectCommits":             true,
			"collectIssues":              true,
			"collectIssueEvents":         true,
			"collectIssueComments":       true,
			"collectIssueLabels":         true,
			"collectPullRequestReviews":  true,
			"collectPullRequestLabels":   true,
			"collectPullRequestCommits":  true,
			"collectPullRequestComments": true,
			"enrichIssues":               true,
			"enrichPullRequests":         true,
			"convertRepos":               true,
			"convertIssues":              true,
			"convertPullRequests":        true,
			"convertCommits":             true,
			"convertPullRequestCommits":  true,
			"convertNotes":               true,
			"convertUsers":               true,
		}
	}

	repoId, collectRepoErr := tasks.CollectRepository(ownerString, repositoryNameString, githubApiClient)
	if collectRepoErr != nil {
		return fmt.Errorf("Could not collect repositories: %v", collectRepoErr)
	}
	if tasksToRun["collectCommits"] {
		progress <- 0.1
		fmt.Println("INFO >>> starting commits collection")
		collectCommitsErr := tasks.CollectCommits(ownerString, repositoryNameString, repoId, scheduler, githubApiClient)
		if collectCommitsErr != nil {
			return fmt.Errorf("Could not collect commits: %v", collectCommitsErr)
		}
		tasks.CollectChildrenOnCommits(ownerString, repositoryNameString, repoId, scheduler, githubApiClient)
	}
	if tasksToRun["collectIssues"] {
		progress <- 0.1
		fmt.Println("INFO >>> starting issues / PRs collection")
		collectIssuesErr := tasks.CollectIssues(ownerString, repositoryNameString, repoId, scheduler, githubApiClient)
		if collectIssuesErr != nil {
			return fmt.Errorf("Could not collect issues: %v", collectIssuesErr)
		}
	}
	if tasksToRun["collectIssueEvents"] {
		progress <- 0.2
		fmt.Println("INFO >>> starting Issue Events collection")
		collectIssueEventsErr := tasks.CollectIssueEvents(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectIssueEventsErr != nil {
			return fmt.Errorf("Could not collect Issue Events: %v", collectIssueEventsErr)
		}
	}

	if tasksToRun["collectIssueComments"] {
		progress <- 0.3
		fmt.Println("INFO >>> starting Issue Comments collection")
		collectIssueCommentsErr := tasks.CollectIssueComments(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectIssueCommentsErr != nil {
			return fmt.Errorf("Could not collect Issue Comments: %v", collectIssueCommentsErr)
		}
	}

	if tasksToRun["collectIssueLabels"] {
		progress <- 0.4
		fmt.Println("INFO >>> starting Issue Labels collection")
		collectIssueLabelsErr := tasks.CollectIssueLabels(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectIssueLabelsErr != nil {
			return fmt.Errorf("Could not collect Issue Labels: %v", collectIssueLabelsErr)
		}
	}
	if tasksToRun["collectPullRequestReviews"] {
		progress <- 0.5
		fmt.Println("INFO >>> collecting PR Reviews collection")
		collectPullRequestReviewsErr := tasks.CollectPullRequestReviews(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectPullRequestReviewsErr != nil {
			return fmt.Errorf("Could not collect PR Reviews: %v", collectPullRequestReviewsErr)
		}
	}
	if tasksToRun["collectPullRequestLabels"] {
		progress <- 0.6
		fmt.Println("INFO >>> starting Pr Labels collection")
		collectPullRequestLabelsErr := tasks.CollectPrLabels(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectPullRequestLabelsErr != nil {
			return fmt.Errorf("Could not collect PR Labels: %v", collectPullRequestLabelsErr)
		}
	}

	if tasksToRun["collectPullRequestCommits"] {
		progress <- 0.7
		fmt.Println("INFO >>> starting PR Commits collection")
		collectPullRequestCommitsErr := tasks.CollectPullRequestCommits(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectPullRequestCommitsErr != nil {
			return fmt.Errorf("Could not collect PR Commits: %v", collectPullRequestCommitsErr)
		}
	}
	if tasksToRun["collectPullRequestComments"] {
		progress <- 0.8
		fmt.Println("INFO >>> starting PR Comments collection")
		collectPullRequestCommentsErr := tasks.CollectPullRequestComments(ownerString, repositoryNameString, scheduler, githubApiClient)
		if collectPullRequestCommentsErr != nil {
			return fmt.Errorf("Could not collect PR Comments: %v", collectPullRequestCommentsErr)
		}
	}
	if tasksToRun["enrichIssues"] {
		progress <- 0.9
		fmt.Println("INFO >>> Enriching Issues")
		enrichmentError := tasks.EnrichIssues()
		if enrichmentError != nil {
			return fmt.Errorf("could not enrich issues: %v", enrichmentError)
		}

	}
	if tasksToRun["enrichPullRequests"] {
		progress <- 0.9
		fmt.Println("INFO >>> Enriching PullRequests")
		enrichPullRequestsError := tasks.EnrichGithubPullRequestWithLabel()
		if enrichPullRequestsError != nil {
			return fmt.Errorf("could not enrich PullRequests: %v", enrichPullRequestsError)
		}
	}
	if tasksToRun["convertRepos"] {
		progress <- 0.9
		err = tasks.ConvertRepos()
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertIssues"] {
		progress <- 0.9
		err = tasks.ConvertIssues()
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertPullRequests"] {
		progress <- 0.9
		err = tasks.ConvertPullRequests()
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertCommits"] {
		progress <- 0.9
		err = tasks.ConvertCommits(repoId)
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertPullRequestCommits"] {
		progress <- 0.9
		err = tasks.PrCommitConvertor()
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertNotes"] {
		progress <- 0.9
		err = tasks.ConvertNotes()
		if err != nil {
			return err
		}
	}
	if tasksToRun["convertUsers"] {
		progress <- 0.9
		err = tasks.ConvertUsers()

		if err != nil {
			return err
		}
	}

	progress <- 1
	return nil
}

func (plugin Github) RootPkgPath() string {
	return "github.com/merico-dev/lake/plugins/github"
}

func (plugin Github) ApiResources() map[string]map[string]core.ApiResourceHandler {
	return map[string]map[string]core.ApiResourceHandler{
		"test": {
			"POST": api.TestConnection,
		},
		"sources": {
			"GET":  api.ListSources,
			"POST": api.PutSource,
		},
		"sources/:sourceId": {
			"GET": api.GetSource,
			"PUT": api.PutSource,
		},
	}
}

// Export a variable named PluginEntry for Framework to search and load
var PluginEntry Github //nolint

// standalone mode for debugging
func main() {
	args := os.Args[1:]
	owner := "merico-dev"
	repo := "lake"
	if len(args) > 0 {
		owner = args[0]
	}
	if len(args) > 1 {
		repo = args[1]
	}

	err := core.RegisterPlugin("github", PluginEntry)
	if err != nil {
		panic(err)
	}
	PluginEntry.Init()
	progress := make(chan float32)
	endpoint := config.V.GetString("GITHUB_ENDPOINT")
	configTokensString := config.V.GetString("GITHUB_AUTH")
	tokens := strings.Split(configTokensString, ",")
	githubApiClient := tasks.CreateApiClient(endpoint, tokens)
	_ = githubApiClient.SetProxy(config.V.GetString("GITHUB_PROXY"))
	_, collectRepoErr := tasks.CollectRepository(owner, repo, githubApiClient)
	if collectRepoErr != nil {
		fmt.Println(fmt.Errorf("Could not collect repositories: %v", collectRepoErr))
	}
	go func() {
		err := PluginEntry.Execute(
			map[string]interface{}{
				"owner":          owner,
				"repositoryName": repo,
				//"tasks":          []string{"collectCommits"},
				//"tasks": []string{"convertCommits"},
				//"tasks": []string{"collectIssues"},
				//"tasks": []string{"enrichIssues"},
				"tasks": []string{"collectPullRequestLabels", "enrichPullRequests", "convertPullRequests"},
			},
			progress,
			context.Background(),
		)
		if err != nil {
			panic(err)
		}
		close(progress)
	}()
	for p := range progress {
		fmt.Println(p)
	}
}
