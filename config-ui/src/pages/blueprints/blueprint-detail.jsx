/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'
// import { CSSTransition } from 'react-transition-group'
import { DEVLAKE_ENDPOINT } from '@/utils/config'
import request from '@/utils/request'
import dayjs from '@/utils/time'
import {
  Button,
  Elevation,
  Intent,
  Switch,
  Card,
  Tooltip,
  Icon,
  Colors,
  Divider,
  Spinner,
  Classes,
  Position,
  Popover,
  Collapse,
  Dialog
} from '@blueprintjs/core'
import { NullBlueprint } from '@/data/NullBlueprint'
import { NullPipelineRun } from '@/data/NullPipelineRun'
import { Providers, ProviderLabels, ProviderIcons } from '@/data/Providers'

// import {
//   WorkflowSteps,
//   WorkflowAdvancedSteps,
//   DEFAULT_DATA_ENTITIES,
//   DEFAULT_BOARDS,
// } from '@/data/BlueprintWorkflow'

import Nav from '@/components/Nav'
import Sidebar from '@/components/Sidebar'
import Content from '@/components/Content'
import TaskActivity from '@/components/pipelines/TaskActivity'
import CodeInspector from '@/components/pipelines/CodeInspector'
import StageLane from '@/components/pipelines/StageLane'

import useBlueprintManager from '@/hooks/useBlueprintManager'
import usePipelineManager from '@/hooks/usePipelineManager'
// import useConnectionManager from '@/hooks/useConnectionManager'
// import { DataEntityTypes } from '@/data/DataEntities'

const StageStatus = {
  PENDING: 'Pending',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
  ACTIVE: 'In Progress',
}

const TaskStatus = {
  COMPLETE: 'TASK_COMPLETED',
  FAILED: 'TASK_FAILED',
  ACTIVE: 'TASK_RUNNING',
  RUNNING: 'TASK_RUNNING',
  CREATED: 'TASK_CREATED',
  PENDING: 'TASK_CREATED',
  CANCELLED: 'TASK_CANCELLED',
}

const TaskStatusLabels = {
  [TaskStatus.COMPLETE]: 'Succeeded',
  [TaskStatus.FAILED]: 'Failed',
  [TaskStatus.ACTIVE]: 'In Progress',
  [TaskStatus.RUNNING]: 'In Progress',
  [TaskStatus.CREATED]: 'Created (Pending)',
  [TaskStatus.PENDING]: 'Created (Pending)',
  [TaskStatus.CANCELLED]: 'Cancelled',
}

const StatusColors = {
  PENDING: '#292B3F',
  COMPLETE: '#4DB764',
  FAILED: '#E34040',
  ACTIVE: '#7497F7',
}

// eslint-disable-next-line no-unused-vars
const StatusBgColors = {
  PENDING: 'transparent',
  COMPLETE: '#EDFBF0',
  FAILED: '#FEEFEF',
  ACTIVE: '#F0F4FE',
}

// eslint-disable-next-line no-unused-vars
const TEST_BLUEPRINT = {
  ...NullBlueprint,
  id: 1,
  name: 'DevLake Daily Blueprint',
  createdAt: new Date().toLocaleString(),
  updatedAt: new Date().toLocaleString(),
}

// eslint-disable-next-line no-unused-vars
const TEST_CONNECTIONS = [
  {
    id: 0,
    provider: Providers.GITHUB,
    name: 'Merico GitHub',
    dataScope: 'merico-dev/ake, merico-dev/lake-website',
    dataEntities: ['code', 'ticket', 'user'],
  },
  {
    id: 0,
    provider: Providers.JIRA,
    name: 'Merico JIRA',
    dataScope: 'Sprint Dev Board, DevLake Sync Board ',
    dataEntities: ['ticket'],
  },
]

const TEST_RUN = {
  id: null,
  status: TaskStatus.RUNNING,
  statusLabel: TaskStatusLabels[TaskStatus.RUNNING],
  icon: <Spinner size={18} intent={Intent.PRIMARY} />,
  startedAt: '7/7/2022, 5:31:33 PM',
  duration: '1 min',
  stage: 'Stage 1',
  tasksTotal: 5,
  tasksFinished: 8,
  // totalTasks: 13,
  error: null,
}

// eslint-disable-next-line no-unused-vars
const EMPTY_RUN = {
  id: null,
  status: TaskStatus.CREATED,
  statusLabel: TaskStatusLabels[TaskStatus.RUNNING],
  icon: null,
  startedAt: Date.now(),
  duration: '0 min',
  stage: 'Stage 1',
  tasksTotal: 0,
  tasksFinished: 0,
  // totalTasks: 0,
  error: null,
}

// eslint-disable-next-line no-unused-vars
const TEST_BLUEPRINT_API_RESPONSE = {
  name: 'DEVLAKE (Hourly)',
  mode: 'NORMAL',
  plan: [
    [
      {
        plugin: 'github',
        subtasks: [
          'collectApiRepo',
          'extractApiRepo',
          'collectApiIssues',
          'extractApiIssues',
          'collectApiPullRequests',
          'extractApiPullRequests',
          'collectApiComments',
          'extractApiComments',
          'collectApiEvents',
          'extractApiEvents',
          'collectApiPullRequestCommits',
          'extractApiPullRequestCommits',
          'collectApiPullRequestReviews',
          'extractApiPullRequestReviewers',
          'collectApiCommits',
          'extractApiCommits',
          'collectApiCommitStats',
          'extractApiCommitStats',
          'enrichPullRequestIssues',
          'convertRepo',
          'convertIssues',
          'convertCommits',
          'convertIssueLabels',
          'convertPullRequestCommits',
          'convertPullRequests',
          'convertPullRequestLabels',
          'convertPullRequestIssues',
          'convertIssueComments',
          'convertPullRequestComments',
        ],
        options: {
          connectionId: 1,
          owner: 'e2corporation',
          repo: 'incubator-devlake',
          transformationRules: {
            issueComponent: '',
            issuePriority: '',
            issueSeverity: '',
            issueTypeBug: '',
            issueTypeIncident: '',
            issueTypeRequirement: '',
            prComponent: '',
            prType: '',
          },
        },
      },
      {
        plugin: 'gitextractor',
        subtasks: null,
        options: {
          repoId: 'github:GithubRepo:1:506830252',
          url: 'https://git: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@github.com/e2corporation/incubator-devlake.git',
        },
      },
    ],
    [
      {
        plugin: 'refdiff',
        subtasks: null,
        options: {
          tagsLimit: 10,
          tagsOrder: '',
          tagsPattern: '',
        },
      },
    ],
  ],
  enable: true,
  cronConfig: '0 0 * * *',
  isManual: false,
  settings: {
    version: '1.0.0',
    connections: [
      {
        connectionId: 1,
        plugin: 'github',
        scope: [
          {
            entities: ['CODE', 'TICKET'],
            options: {
              owner: 'e2corporation',
              repo: 'incubator-devlake',
            },
            transformation: {
              prType: '',
              prComponent: '',
              issueSeverity: '',
              issueComponent: '',
              issuePriority: '',
              issueTypeRequirement: '',
              issueTypeBug: '',
              issueTypeIncident: '',
              refdiff: {
                tagsOrder: '',
                tagsPattern: '',
                tagsLimit: 10,
              },
            },
          },
        ],
      },
    ],
  },
  id: 1,
  createdAt: '2022-07-11T10:23:38.908-04:00',
  updatedAt: '2022-07-11T10:23:38.908-04:00',
}

const TEST_STAGES = [
  {
    id: 1,
    name: 'stage-1',
    title: 'Stage 1',
    status: StageStatus.COMPLETED,
    icon: <Icon icon='tick-circle' size={14} color={StatusColors.COMPLETE} />,
    tasks: [
      {
        id: 0,
        provider: 'jira',
        icon: ProviderIcons[Providers.JIRA](14, 14),
        title: 'JIRA',
        caption: 'STREAM Board',
        duration: '4 min',
        subTasksCompleted: 25,
        recordsFinished: 1234,
        message: 'All 25 subtasks completed',
        status: TaskStatus.COMPLETE,
      },
      {
        id: 0,
        provider: 'jira',
        icon: ProviderIcons[Providers.JIRA](14, 14),
        title: 'JIRA',
        caption: 'LAKE Board',
        duration: '4 min',
        subTasksCompleted: 25,
        recordsFinished: 1234,
        message: 'All 25 subtasks completed',
        status: TaskStatus.COMPLETE,
      },
    ],
    stageHeaderClassName: 'complete',
  },
  {
    id: 2,
    name: 'stage-2',
    title: 'Stage 2',
    status: StageStatus.PENDING,
    icon: <Spinner size={14} intent={Intent.PRIMARY} />,
    tasks: [
      {
        id: 0,
        provider: 'jira',
        icon: ProviderIcons[Providers.JIRA](14, 14),
        title: 'JIRA',
        caption: 'EE Board',
        duration: '5 min',
        subTasksCompleted: 25,
        recordsFinished: 1234,
        message: 'Subtask 5/25: Extracting Issues',
        status: TaskStatus.ACTIVE,
      },
      {
        id: 0,
        provider: 'jira',
        icon: ProviderIcons[Providers.JIRA](14, 14),
        title: 'JIRA',
        caption: 'EE Bugs Board',
        duration: '0 min',
        subTasksCompleted: 0,
        recordsFinished: 0,
        message: 'Invalid Board ID',
        status: TaskStatus.FAILED,
      },
    ],
    stageHeaderClassName: 'active',
  },
  {
    id: 3,
    name: 'stage-3',
    title: 'Stage 3',
    status: StageStatus.PENDING,
    icon: null,
    tasks: [
      {
        id: 0,
        provider: 'github',
        icon: ProviderIcons[Providers.GITHUB](14, 14),
        title: 'GITHUB',
        caption: 'merico-dev/lake',
        duration: null,
        subTasksCompleted: 0,
        recordsFinished: 0,
        message: 'Subtasks pending',
        status: TaskStatus.CREATED,
      },
    ],
    stageHeaderClassName: 'pending',
  },
  {
    id: 4,
    name: 'stage-4',
    title: 'Stage 4',
    status: StageStatus.PENDING,
    icon: null,
    tasks: [
      {
        id: 0,
        providr: 'github',
        icon: ProviderIcons[Providers.GITHUB](14, 14),
        title: 'GITHUB',
        caption: 'merico-dev/lake',
        duration: null,
        subTasksCompleted: 0,
        recordsFinished: 0,
        message: 'Subtasks pending',
        status: TaskStatus.CREATED,
      },
    ],
    stageHeaderClassName: 'pending',
  },
]

const TEST_HISTORICAL_RUNS = [
  {
    id: 0,
    status: 'TASK_COMPLETED',
    statusLabel: 'Completed',
    statusIcon: <Icon icon='tick-circle' size={14} color={Colors.GREEN5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:15 AM',
    duration: '15 min',
  },
  {
    id: 1,
    status: 'TASK_COMPLETED',
    statusLabel: 'Completed',
    statusIcon: <Icon icon='tick-circle' size={14} color={Colors.GREEN5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:15 AM',
    duration: '15 min',
  },
  {
    id: 2,
    status: 'TASK_FAILED',
    statusLabel: 'Failed',
    statusIcon: <Icon icon='delete' size={14} color={Colors.RED5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:00 AM',
    duration: '0 min',
  },
  {
    id: 3,
    status: 'TASK_COMPLETED',
    statusLabel: 'Completed',
    statusIcon: <Icon icon='tick-circle' size={14} color={Colors.GREEN5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:15 AM',
    duration: '15 min',
  },
  {
    id: 4,
    status: 'TASK_COMPLETED',
    statusLabel: 'Completed',
    statusIcon: <Icon icon='tick-circle' size={14} color={Colors.GREEN5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:15 AM',
    duration: '15 min',
  },
  {
    id: 5,
    status: 'TASK_FAILED',
    statusLabel: 'Failed',
    statusIcon: <Icon icon='delete' size={14} color={Colors.RED5} />,
    startedAt: '05/25/2022 0:00 AM',
    completedAt: '05/25/2022 0:00 AM',
    duration: '0 min',
  },
]

const BlueprintDetail = (props) => {
  // eslint-disable-next-line no-unused-vars
  const history = useHistory()
  const { bId } = useParams()

  const [blueprintId, setBlueprintId] = useState()
  // @todo: replace with live $blueprint from Hook
  const [activeBlueprint, setActiveBlueprint] = useState(TEST_RUN)
  // eslint-disable-next-line no-unused-vars
  const [blueprintConnections, setBlueprintConnections] = useState([])
  const [blueprintPipelines, setBlueprintPipelines] = useState([])
  const [lastPipeline, setLastPipeline] = useState()
  const [inspectedPipeline, setInspectedPipeline] = useState(NullPipelineRun)
  const [currentRun, setCurrentRun] = useState()
  const [showCurrentRunTasks, setShowCurrentRunTasks] = useState(true)
  const [showInspector, setShowInspector] = useState(false)
  const [currentStages, setCurrentStages] = useState([])
  const [historicalRuns, setHistoricalRuns] = useState(TEST_HISTORICAL_RUNS)

  const pollTimer = 5000
  const pollInterval = useRef()
  const [autoRefresh, setAutoRefresh] = useState(false)

  const [expandRun, setExpandRun] = useState(null)

  const {
    // eslint-disable-next-line no-unused-vars
    blueprint,
    blueprints,
    name,
    cronConfig,
    customCronConfig,
    cronPresets,
    tasks,
    detectedProviderTasks,
    enable,
    setName: setBlueprintName,
    setCronConfig,
    setCustomCronConfig,
    setTasks: setBlueprintTasks,
    setDetectedProviderTasks,
    setEnable: setEnableBlueprint,
    isFetching: isFetchingBlueprints,
    isSaving,
    isDeleting,
    createCronExpression: createCron,
    getCronSchedule: getSchedule,
    getCronPreset,
    getCronPresetByConfig,
    getNextRunDate,
    activateBlueprint,
    deactivateBlueprint,
    // eslint-disable-next-line no-unused-vars
    fetchBlueprint,
    fetchAllBlueprints,
    saveBlueprint,
    deleteBlueprint,
    saveComplete,
    deleteComplete,
  } = useBlueprintManager()

  const {
    activePipeline,
    pipelines,
    isFetchingAll: isFetchingAllPipelines,
    fetchPipeline,
    runPipeline,
    cancelPipeline,
    fetchAllPipelines,
    lastRunId,
    setSettings: setPipelineSettings,
    // eslint-disable-next-line no-unused-vars
    allowedProviders,
    // eslint-disable-next-line no-unused-vars
    detectPipelineProviders,
  } = usePipelineManager()

  const buildPipelineStages = useCallback((tasks = []) => {
    let stages = {}
    console.log('>>>> RECEIVED PIPELINE TASKS FOR STAGE...', tasks)
    tasks?.forEach(tS => {
      stages = {
        ...stages,
        [tS.pipelineRow]: tasks?.filter(t => t.pipelineRow === tS.pipelineRow)
      }
    })
    console.log('>>> BUILDING PIPELINE STAGES...', stages)
    return stages
  }, [])

  const runBlueprint = useCallback(() => {
    if (activeBlueprint !== null) {
      runPipeline()
    }
  }, [activeBlueprint, runPipeline])

  const handleBlueprintActivation = useCallback((blueprint) => {
    if (blueprint.enable) {
      deactivateBlueprint(blueprint)
    } else {
      activateBlueprint(blueprint)
    }
    // fetchBlueprint(blueprint?.id)
    // fetchAllPipelines()
  }, [activateBlueprint, deactivateBlueprint])

  const handlePipelineDialogClose = useCallback(() => {
    setExpandRun(null)
  }, [])

  const inspectRun = useCallback((pipelineRun) => {
    setInspectedPipeline(pipelineRun)
    setShowInspector(true)
  }, [])

  const viewPipelineRun = useCallback((pipelineRun) => {
    const fetchPipelineTasks = async () => {
      const t = await request.get(`${DEVLAKE_ENDPOINT}/pipelines/${pipelineRun?.id}/tasks`)
      setExpandRun({
        ...pipelineRun,
        tasks: t.data?.tasks || []
      })
    }
    if (pipelineRun?.id !== null) {
      fetchPipelineTasks()
    }
  }, [setExpandRun])

  const handleInspectorClose = useCallback(() => {
    setInspectedPipeline(NullPipelineRun)
    setShowInspector(false)
  }, [])

  const cancelRun = () => {}

  const getTaskStatusIcon = (status) => {
    let icon = null
    switch (status) {
      case TaskStatus.ACTIVE:
      case TaskStatus.RUNNING:
        icon = <Spinner size={14} intent={Intent.PRIMARY} />
        break
      case TaskStatus.COMPLETE:
        icon = <Icon icon='tick-circle' size={14} color={Colors.GREEN5} />
        break
      case TaskStatus.FAILED:
        icon = <Icon icon='delete' size={14} color={Colors.RED5} />
        break
      case TaskStatus.CANCELLED:
      case TaskStatus.CREATED:
        break
    }
    return icon
  }

  useEffect(() => {
    setBlueprintId(bId)
    console.log('>>> REQUESTED BLUEPRINT ID ===', bId)
  }, [bId])

  useEffect(() => {
    if (blueprintId) {
      // @todo: enable blueprint data fetch
      fetchBlueprint(blueprintId)
      fetchAllPipelines()
    }
  }, [blueprintId, fetchBlueprint, fetchAllPipelines])

  useEffect(() => {
    console.log('>>>> SETTING ACTIVE BLUEPRINT...', blueprint)
    if (blueprint?.id) {
      setActiveBlueprint((b) => ({
        ...b,
        ...blueprint,
        id: blueprint.id,
        name: blueprint.name,
      }))
      setBlueprintConnections(
        blueprint?.settings?.connections.map((connection, cIdx) => ({
          id: cIdx,
          provider: connection?.plugin,
          name: `${
            ProviderLabels[connection?.plugin.toUpperCase()]
          } Connection (ID #${connection?.connectionId})`,
          dataScope: connection?.scope
            .map((s) => [`${s.options?.owner}/${s?.options?.repo}`])
            .join(', '),
          dataEntities: [],
        }))
      )
      setPipelineSettings({
        name: `${blueprint?.name} ${Date.now()}`,
        blueprintId: blueprint?.id,
        plan: blueprint?.plan,
      })
    }
  }, [blueprint, setPipelineSettings])

  useEffect(() => {
    console.log('>>>> FETCHED ALL PIPELINES..', pipelines, activeBlueprint?.id)
    //  {id: 5, status: 'TASK_FAILED', statusLabel: 'Failed', statusIcon: <Icon icon='delete' size={14} color={Colors.RED5} />,startedAt: '05/25/2022 0:00 AM', completedAt: '05/25/2022 0:00 AM', duration: '0 min' },
    setBlueprintPipelines(
      pipelines.filter((p) => p.blueprintId === activeBlueprint?.id)
    )
  }, [pipelines, activeBlueprint])

  useEffect(() => {
    console.log('>>>> RELATED BLUEPRINT PIPELINES..', blueprintPipelines)
    setLastPipeline(blueprintPipelines[0])
    // blueprintPipelines.filter(p => p.status !== TaskStatus.RUNNING).map
    setHistoricalRuns(
      blueprintPipelines.map((p, pIdx) => ({
        id: p.id,
        status: p.status,
        statusLabel: TaskStatusLabels[p.status],
        statusIcon: getTaskStatusIcon(p.status),
        startedAt: p.beganAt ? dayjs(p.beganAt).format('L LTS') : '-',
        completedAt: p.finishedAt ? dayjs(p.updatedAt).format('L LTS') : ' - ',
        duration:
          p.beganAt && p.finishedAt
            ? dayjs(p.beganAt).from(p.finishedAt, true)
            : (p.beganAt ? dayjs(p.beganAt).toNow(true) : ' - '),
      }))
    )
  }, [blueprintPipelines])

  useEffect(() => {
    // if (lastPipeline?.id && lastPipeline.status === TaskStatus.RUNNING) {
    if (lastPipeline?.id && [TaskStatus.CREATED, TaskStatus.RUNNING, TaskStatus.COMPLETE, TaskStatus.FAILED].includes(lastPipeline.status)) {
      fetchPipeline(lastPipeline?.id)
      setCurrentRun((cR) => ({
        ...cR,
        id: lastPipeline.id,
        status: lastPipeline.status,
        statusLabel: TaskStatusLabels[lastPipeline.status],
        icon: getTaskStatusIcon(lastPipeline.status),
        startedAt: dayjs(lastPipeline.beganAt).format('L LTS'),
        duration:
          lastPipeline.status === 'TASK_RUNNING'
            ? dayjs(lastPipeline.beganAt).toNow(true)
            : dayjs(lastPipeline.beganAt).from(
              lastPipeline.finishedAt || lastPipeline.updatedAt,
              true
            ),
        stage: `Stage ${lastPipeline.stage}`,
        tasksFinished: Number(lastPipeline.finishedTasks),
        tasksTotal: Number(lastPipeline.totalTasks),
        // totalTasks: Number(lastPipeline.totalTasks),
        error: lastPipeline.message || null,
      }))
    }
  }, [
    fetchPipeline,
    lastPipeline
  ])

  useEffect(() => {
    fetchAllPipelines()
  }, [lastRunId, fetchAllPipelines])

  useEffect(() => {
    if (activePipeline?.id && activePipeline?.id !== null) {
      setCurrentStages(buildPipelineStages(activePipeline.tasks))
      setAutoRefresh(activePipeline?.status === TaskStatus.RUNNING)
    }
  }, [activePipeline, buildPipelineStages])

  useEffect(() => {
    console.log('>> BUILDING CURRENT STAGES...', currentStages)
  }, [currentStages])

  useEffect(() => {
    if (autoRefresh && activePipeline?.id) {
      console.log('>> ACTIVITY POLLING ENABLED!')
      pollInterval.current = setInterval(() => {
        fetchPipeline(activePipeline?.id)
        // setLastPipeline(activePipeline)
      }, pollTimer)
    } else {
      console.log('>> ACTIVITY POLLING DISABLED!')
      clearInterval(pollInterval.current)
      if (activePipeline?.id) {
        fetchPipeline(activePipeline?.id)
        fetchAllPipelines()
      }
    }
  }, [autoRefresh, fetchPipeline, fetchAllPipelines, activePipeline?.id, pollTimer])

  // useEffect(() => {
  //   console.log('>> VIEW PIPELINE RUN....', expandRun)
  // }, [expandRun])

  return (
    <>
      <div className='container'>
        <Nav />
        <Sidebar />
        <Content>
          <main className='main'>
            <div
              className='blueprint-header'
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div className='blueprint-name' style={{}}>
                <h2 style={{ fontWeight: 'bold' }}>{activeBlueprint?.name}</h2>
              </div>
              <div
                className='blueprint-info'
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div className='blueprint-schedule'>
                  <span
                    className='blueprint-schedule-interval'
                    style={{ textTransform: 'capitalize', padding: '0 10px' }}
                  >
                    {activeBlueprint?.interval} (at{' '}
                    {dayjs(getNextRunDate(activeBlueprint?.cronConfig)).format(
                      'hh:mm A'
                    )}
                    )
                  </span>{' '}
                  &nbsp;{' '}
                  <span className='blueprint-schedule-nextrun'>
                    {activeBlueprint?.isManual
                      ? <strong>Manual Mode</strong>
                      : (
                        <>
                          Next Run{' '}
                          {dayjs(
                            getNextRunDate(activeBlueprint?.cronConfig)
                          ).fromNow()}
                        </>
                        )}
                  </span>
                </div>
                <div
                  className='blueprint-actions'
                  style={{ padding: '0 10px' }}
                >
                  <Button
                    intent={Intent.PRIMARY}
                    small
                    text='Run Now'
                    onClick={runBlueprint}
                    disabled={!activeBlueprint?.enable || currentRun?.status === TaskStatus.RUNNING}
                  />
                </div>
                <div className='blueprint-enabled'>
                  <Switch
                    id='blueprint-enable'
                    name='blueprint-enable'
                    checked={activeBlueprint?.enable}
                    label={
                      activeBlueprint?.enable
                        ? 'Blueprint Enabled'
                        : 'Blueprint Disabled'
                    }
                    onChange={() => handleBlueprintActivation(activeBlueprint)}
                    style={{ marginBottom: 0, marginTop: 0, color: !activeBlueprint?.enable ? Colors.GRAY3 : 'inherit' }}
                    disabled={currentRun?.status === TaskStatus.RUNNING}
                  />
                </div>
                <div style={{ padding: '0 10px' }}>
                  <Button
                    intent={Intent.PRIMARY}
                    icon='trash'
                    small
                    minimal
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* <div className='blueprint-connections' style={{ width: '100%', alignSelf: 'flex-start' }}>
              <h3>Overview</h3>
              <Card elevation={Elevation.TWO} style={{ padding: '2px' }}>
              <table className='bp3-html-table bp3-html-table-bordered connections-overview-table' style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '200px' }}>Data Connection</th>
                    <th style={{ width: '100%' }}>Data Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {blueprintConnections?.map((c, cIdx) => (
                  <tr key={`connection-row-key-${cIdx}`}>
                    <td>
                      {c.name}
                    </td>
                    <td>
                      {c.dataScope}{' '}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
              </Card>
            </div> */}

            <div
              className='blueprint-run'
              style={{
                width: '100%',
                alignSelf: 'flex-start',
                minWidth: '750px',
              }}
            >
              <h3>Current Run</h3>
              <Card
                className={`current-run status-${currentRun?.status.toLowerCase()}`}
                elevation={Elevation.TWO}
                style={{ padding: '12px', marginBottom: '8px' }}
              >
                {currentRun && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <div>
                      <label style={{ color: '#94959F' }}>Status</label>
                      <div style={{ display: 'flex' }}>
                        <span style={{ marginRight: '6px', marginTop: '2px' }}>
                          {currentRun?.icon}
                        </span>
                        <h4
                          className={`status-${currentRun?.status.toLowerCase()}`}
                          style={{ fontSize: '15px', margin: 0, padding: 0 }}
                        >
                          {currentRun?.statusLabel}
                        </h4>
                      </div>
                    </div>
                    <div>
                      <label style={{ color: '#94959F' }}>Started at</label>
                      <h4 style={{ fontSize: '15px', margin: 0, padding: 0 }}>
                        {currentRun?.startedAt}
                      </h4>
                    </div>
                    <div>
                      <label style={{ color: '#94959F' }}>Duration</label>
                      <h4 style={{ fontSize: '15px', margin: 0, padding: 0 }}>
                        {currentRun?.duration}
                      </h4>
                    </div>
                    <div>
                      <label style={{ color: '#94959F' }}>Current Stage</label>
                      <h4 style={{ fontSize: '15px', margin: 0, padding: 0 }}>
                        {currentRun?.stage}
                      </h4>
                    </div>
                    <div>
                      <label style={{ color: '#94959F' }}>
                        Tasks Completed
                      </label>
                      <h4 style={{ fontSize: '15px', margin: 0, padding: 0 }}>
                        {currentRun?.tasksFinished} /{' '}
                        {currentRun?.tasksTotal}
                      </h4>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'block' }}>
                        {/* <Button intent={Intent.PRIMARY} outlined text='Cancel' onClick={cancelRun} /> */}
                        <Popover
                          key='popover-help-key-cancel-run'
                          className='trigger-pipeline-cancel'
                          popoverClassName='popover-pipeline-cancel'
                          position={Position.BOTTOM}
                          autoFocus={false}
                          enforceFocus={false}
                          usePortal={true}
                          disabled={currentRun?.status !== 'TASK_RUNNING'}
                        >
                          <Button
                            // icon='stop'
                            text='Cancel'
                            intent={Intent.PRIMARY}
                            outlined
                            disabled={currentRun?.status !== 'TASK_RUNNING'}
                          />
                          <>
                            <div
                              style={{
                                fontSize: '12px',
                                padding: '12px',
                                maxWidth: '200px',
                              }}
                            >
                              <p>
                                Are you Sure you want to cancel this{' '}
                                <strong>Pipeline Run</strong>?
                              </p>
                              <div
                                style={{
                                  display: 'flex',
                                  width: '100%',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <Button
                                  text='NO'
                                  minimal
                                  small
                                  className={Classes.POPOVER_DISMISS}
                                  style={{
                                    marginLeft: 'auto',
                                    marginRight: '3px',
                                  }}
                                />
                                <Button
                                  className={Classes.POPOVER_DISMISS}
                                  text='YES'
                                  icon='small-tick'
                                  intent={Intent.DANGER}
                                  small
                                  onClick={() => cancelPipeline(currentRun?.id)}
                                />
                              </div>
                            </div>
                          </>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )}
                {!currentRun && (
                  <>
                    <p style={{ margin: 0 }}>
                      There is no current run for this blueprint.
                    </p>
                  </>
                )}
                {currentRun?.error && (
                  <div style={{ marginTop: '10px' }}>
                    <p className='error-msg' style={{ color: '#E34040' }}>
                      {currentRun?.error}
                    </p>
                  </div>
                )}
              </Card>
              {currentRun && (
                <Card
                  elevation={Elevation.TWO}
                  style={{ padding: '12px', marginBottom: '8px' }}
                >
                  <div
                    className='blueprint-run-activity'
                    style={{ display: 'flex', width: '100%' }}
                  >
                    <div
                      className='pipeline-task-activity' style={{
                      // padding: '20px',
                        flex: 1,
                        padding: Object.keys(currentStages).length === 1 ? '0' : 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {Object.keys(currentStages).length > 0 && (
                        <div
                          className='pipeline-multistage-activity'
                        >
                          {Object.keys(currentStages).map((sK, sIdx) => (
                            <StageLane key={`stage-lane-key-${sIdx}`} stages={currentStages} sK={sK} sIdx={sIdx} showStageTasks={showCurrentRunTasks} />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* {currentStages.map((stage, stageIdx) => (
                      <div
                        className='run-stage'
                        key={`run-stage-key-${stageIdx}`}
                        style={{ flex: 1, margin: '0 4px' }}
                      >
                        <h3
                          className={`stage-header ${stage?.stageHeaderClassName}`}
                          style={{ margin: '0', padding: '7px' }}
                        >
                          <span style={{ float: 'right' }}>{stage?.icon}</span>
                          {stage?.title}
                        </h3>
                        {showCurrentRunTasks && (
                          <div className='task-activity'>
                            {stage.tasks.map((stageTask, stIdx) => (
                              <div
                                className='stage-task'
                                key={`stage-task-key-${stIdx}`}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <div
                                  className='stage-task-info'
                                  style={{ display: 'flex', padding: '8px' }}
                                >
                                  <div
                                    className='task-icon'
                                    style={{ minWidth: '24px' }}
                                  >
                                    {stageTask.icon}
                                  </div>
                                  <div
                                    className='task-title'
                                    style={{ flex: 1 }}
                                  >
                                    <div style={{ marginBottom: '8px' }}>
                                      <strong>{stageTask.title}</strong>{' '}
                                      {stageTask?.caption}
                                    </div>
                                    <div
                                      className='stage-task-progress'
                                      style={{
                                        color:
                                          stageTask?.status ===
                                          TaskStatus.FAILED
                                            ? StatusColors.FAILED
                                            : 'inherit',
                                      }}
                                    >
                                      <div>{stageTask?.message}</div>
                                      <div>
                                        {stageTask?.recordsFinished} records
                                        finished
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className='task-duration'
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      color: StatusColors[stageTask?.status],
                                    }}
                                  >
                                    {stageTask.duration}{' '}
                                    {stageTask?.status ===
                                      TaskStatus.FAILED && (
                                      <>
                                        ({TaskStatusLabels[TaskStatus.FAILED]})
                                      </>
                                    )}
                                    {stageTask?.status ===
                                      TaskStatus.ACTIVE && (
                                      <>
                                        ({TaskStatusLabels[TaskStatus.ACTIVE]})
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Divider />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))} */}
                    <Button
                      icon={
                        showCurrentRunTasks ? 'chevron-down' : 'chevron-right'
                      }
                      intent={Intent.NONE}
                      minimal
                      small
                      style={{
                        textAlign: 'center',
                        display: 'block',
                        float: 'right',
                        margin: '0 10px',
                        marginBottom: 'auto',
                      }}
                      onClick={() => setShowCurrentRunTasks((s) => !s)}
                    />
                  </div>
                </Card>
              )}
            </div>

            <div
              className='blueprint-historical-runs'
              style={{
                width: '100%',
                alignSelf: 'flex-start',
                minWidth: '750px',
              }}
            >
              <h3>Historical Runs</h3>
              <Card
                elevation={Elevation.TWO}
                style={{ padding: '0', marginBottom: '8px' }}
              >
                <table
                  className='bp3-html-table bp3-html-table historical-runs-table'
                  style={{ width: '100%' }}
                >
                  <thead>
                    <tr>
                      <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>
                        Status
                      </th>
                      <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>
                        Started at
                      </th>
                      <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>
                        Completed at
                      </th>
                      <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>
                        Duration
                      </th>
                      <th style={{ width: '100%', whiteSpace: 'nowrap' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {historicalRuns.map((run, runIdx) => (
                      <tr key={`historical-run-key-${runIdx}`}>
                        <td
                          style={{
                            width: '15%',
                            whiteSpace: 'nowrap',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              float: 'left',
                              marginRight: '5px',
                            }}
                          >
                            {run.statusIcon}
                          </span>{' '}
                          {run.statusLabel}
                        </td>
                        <td
                          style={{
                            width: '25%',
                            whiteSpace: 'nowrap',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          {run.startedAt}
                        </td>
                        <td
                          style={{
                            width: '25%',
                            whiteSpace: 'nowrap',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          {run.completedAt}
                        </td>
                        <td
                          style={{
                            width: '15%',
                            whiteSpace: 'nowrap',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          {run.duration}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            borderBottom: '1px solid #f0f0f0',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Tooltip intent={Intent.PRIMARY} content='View JSON'>
                            <Button
                              intent={Intent.PRIMARY}
                              minimal
                              small
                              icon='code'
                              onClick={() => inspectRun(blueprintPipelines.find(p => p.id === run.id))}
                            />
                          </Tooltip>
                          {/* <Tooltip
                            intent={Intent.PRIMARY}
                            content='View Full Log'
                          > */}
                          <Button
                            intent={Intent.NONE}
                            minimal
                            small
                            icon='document'
                            style={{ marginLeft: '10px' }}
                            // @todo: enable log view dialog support feature
                            disabled
                          />
                          {/* </Tooltip> */}
                          <Tooltip
                            intent={Intent.PRIMARY}
                            content='Show Run Activity'
                          >
                            <Button
                              intent={Intent.PRIMARY}
                              minimal
                              small
                              icon={expandRun?.id === run.id ? 'chevron-down' : 'chevron-right'}
                              style={{ marginLeft: '10px' }}
                              onClick={() => viewPipelineRun(blueprintPipelines.find(p => p.id === run.id))}
                            />
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                    {historicalRuns.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          There are no historical runs associated with this
                          blueprint.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </main>
        </Content>
      </div>
      <CodeInspector isOpen={showInspector} activePipeline={inspectedPipeline} onClose={handleInspectorClose} />
      <Dialog
        className='dialog-view-pipeline'
        // icon=
        title={`Historical Run #${expandRun?.id}`}
        isOpen={expandRun !== null}
        onClose={handlePipelineDialogClose}
        onClosed={() => {}}
        canOutsideClickClose={true}
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className={Classes.DIALOG_BODY}>
          {Object.keys(buildPipelineStages(expandRun?.tasks)).length > 0 && (
            <div
              className='pipeline-multistage-activity'
            >
              {Object.keys(buildPipelineStages(expandRun?.tasks)).map((sK, sIdx) => (
                <StageLane key={`stage-lane-key-${sIdx}`} stages={buildPipelineStages(expandRun?.tasks)} sK={sK} sIdx={sIdx} showStageTasks={true} />
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}

export default BlueprintDetail
