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
import { DataEntityTypes } from '@/data/DataEntities'

const WorkflowSteps = [
  {
    id: 1,
    active: 1,
    name: 'add-connections',
    title: 'Add Data Connections',
    complete: false,
    icon: null,
    errors: []
  },
  {
    id: 2,
    active: 0,
    name: 'set-data-scope',
    title: 'Set Data Scope',
    complete: false,
    icon: null,
    errors: []
  },
  {
    id: 3,
    active: 0,
    name: 'add-transformation',
    title: 'Add Transformation (Optional)',
    complete: false,
    icon: null,
    errors: []
  },
  {
    id: 4,
    active: 0,
    name: 'set-sync-frequeny',
    title: 'Set Sync Frequency',
    complete: false,
    icon: null,
    errors: []
  },
]

const WorkflowAdvancedSteps = [
  {
    id: 1,
    active: 1,
    name: 'add-advanced-configuration',
    title: 'Create Advanced Configuration',
    complete: false,
    icon: null,
    errors: []
  },
  // {
  //   id: 2,
  //   active: 0,
  //   name: 'validate-advanced-configuration',
  //   title: 'Validate Blueprint JSON',
  //   complete: false,
  //   icon: null,
  //   errors: []
  // },
  {
    id: 2,
    active: 0,
    name: 'set-sync-frequeny',
    title: 'Set Sync Frequency',
    complete: false,
    icon: null,
    errors: []
  },
]

const DEFAULT_DATA_ENTITIES = [
  {
    id: 1,
    name: 'source-code-management',
    title: 'Source Code Management',
    value: DataEntityTypes.CODE,
  },
  {
    id: 2,
    name: 'issue-tracking',
    title: 'Issue Tracking',
    value: DataEntityTypes.TICKET,
  },
  {
    id: 3,
    name: 'code-review',
    title: 'Code Review',
    value: DataEntityTypes.CODE_REVIEW,
  },
  {
    id: 4,
    name: 'cross-domain',
    title: 'Crossdomain',
    value: DataEntityTypes.CROSSDOMAIN,
  },
  { id: 5, name: 'ci-cd', title: 'CI/CD', value: DataEntityTypes.DEVOPS },
]

const DEFAULT_BOARDS = [
  {
    id: 1,
    name: 'scrum-lake',
    title: 'DEVLAKE BOARD',
    value: 'scrum-lake',
    type: 'scrum',
    self: 'https://your-domain.atlassian.net/rest/agile/1.0/board/1',
  },
  {
    id: 2,
    name: 'scrum-stream',
    title: 'DEVSTREAM BOARD',
    value: 'scrum-stream',
    type: 'scrum',
    self: 'https://your-domain.atlassian.net/rest/agile/1.0/board/2',
  },
]

export { WorkflowSteps, WorkflowAdvancedSteps, DEFAULT_DATA_ENTITIES, DEFAULT_BOARDS }
