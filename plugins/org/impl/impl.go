/*
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package impl

import (
	"github.com/apache/incubator-devlake/impl/dalgorm"
	"github.com/apache/incubator-devlake/plugins/core"
	"github.com/apache/incubator-devlake/plugins/helper"
	"github.com/apache/incubator-devlake/plugins/org/api"
	"github.com/apache/incubator-devlake/plugins/org/tasks"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

var _ core.PluginMeta = (*Org)(nil)
var _ core.PluginInit = (*Org)(nil)
var _ core.PluginTask = (*Org)(nil)

type Org struct {
	handlers *api.Handlers
}

func (plugin *Org) Init(config *viper.Viper, logger core.Logger, db *gorm.DB) error {
	basicRes := helper.NewDefaultBasicRes(config, logger, db)
	plugin.handlers = api.NewHandlers(dalgorm.NewDalgorm(db), basicRes)
	return nil
}

func (plugin Org) Description() string {
	return "collect data related to team and organization"
}

func (plugin Org) SubTaskMetas() []core.SubTaskMeta {
	return []core.SubTaskMeta{
		tasks.ConnectUserAccountsExactMeta,
	}
}

func (plugin Org) PrepareTaskData(taskCtx core.TaskContext, options map[string]interface{}) (interface{}, error) {
	var op tasks.Options
	err := mapstructure.Decode(options, &op)
	if err != nil {
		return nil, err
	}
	taskData := &tasks.TaskData{
		Options: &op,
	}
	return taskData, nil
}

func (plugin Org) RootPkgPath() string {
	return "github.com/apache/incubator-devlake/plugins/org"
}

func (plugin Org) ApiResources() map[string]map[string]core.ApiResourceHandler {
	return map[string]map[string]core.ApiResourceHandler{
		"teams.csv": {
			"GET": plugin.handlers.GetTeam,
			"PUT": plugin.handlers.CreateTeam,
		},
		"users.csv": {
			"GET": plugin.handlers.GetUser,
			"PUT": plugin.handlers.CreateUser,
		},

		"user_account_mapping.csv": {
			"GET": plugin.handlers.GetUserAccountMapping,
			"PUT": plugin.handlers.CreateUserAccountMapping,
		},
	}
}
