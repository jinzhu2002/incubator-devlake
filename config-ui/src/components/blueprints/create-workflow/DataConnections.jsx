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
import React, { Fragment, useEffect, useState, useCallback } from 'react'
import {
  Button,
  Icon,
  Intent,
  InputGroup,
  Divider,
  Spinner,
  Elevation,
  Card,
  Colors,
} from '@blueprintjs/core'

import BlueprintNameCard from '../BlueprintNameCard'
// import InputValidationError from '@/components/validation/InputValidationError'
import ConnectionsSelector from '@/components/blueprints/ConnectionsSelector'

const DataConnections = (props) => {
  const {
    activeStep,
    name,
    blueprintConnections = [],
    onlineStatus = [],
    connectionsList = [],
    setBlueprintName = () => {},
    setBlueprintConnections = () => {},
    fieldHasError = () => {},
    getFieldError = () => {},
    addConnection = () => {},
    manageConnection = () => {},
    onAdvancedMode = () => {},
    isSaving = false,
    advancedMode = false
  } = props

  const displayOnlineStatus = useCallback((testResponse) => {
    let status = null
    switch (testResponse?.status) {
      case 200:
        status = <span style={{ color: Colors.GREEN4 }}>Online</span>
        break
      case 400:
      case 404:
      default:
        status = <span style={{ color: Colors.RED4 }}>Offline</span>
    }
    return status
  }, [])

  return (
    <div className='workflow-step workflow-step-data-connections' data-step={activeStep?.id}>
      <BlueprintNameCard
        advancedMode={advancedMode}
        activeStep={activeStep}
        name={name}
        setBlueprintName={setBlueprintName}
        fieldHasError={fieldHasError}
        getFieldError={getFieldError}
      />
      <Card
        className='workflow-card'
        elevation={Elevation.TWO}
        style={{ width: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0 }}>
            Add Data Connections <span className='required-star'>*</span>
          </h3>
          <div>
            <Button
              text='Add Connection'
              icon='plus'
              intent={Intent.PRIMARY}
              small
              onClick={addConnection}
            />
          </div>
        </div>
        <Divider className='section-divider' />

        <h4>Select Connections</h4>
        <p>Select from existing or create new connections</p>

        <ConnectionsSelector
          items={connectionsList}
          selectedItems={blueprintConnections}
          onItemSelect={setBlueprintConnections}
          onClear={setBlueprintConnections}
          onRemove={setBlueprintConnections}
          disabled={isSaving}
        />
        {blueprintConnections.length > 0 && (
          <Card
            className='selected-connections-list'
            elevation={Elevation.ZERO}
            style={{ padding: 0, marginTop: '10px' }}
          >
            {blueprintConnections.map((bC, bcIdx) => (
              <div
                className='connection-entry'
                key={`connection-row-key-${bcIdx}`}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '32px',
                  lineHeight: '100%',
                  justifyContent: 'space-between',
                  // margin: '8px 0',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div>
                  <div className='connection-name' style={{ fontWeight: 600 }}>
                    {bC.title}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignContent: 'center',
                  }}
                >
                  <div
                    className='connection-status'
                    style={{ textTransform: 'capitalize' }}
                  >
                    {(bC.statusResponse && displayOnlineStatus(bC.statusResponse)) || <><span style={{ display: 'inline-block', marginRight: '5px', width: '12px', height: '12px', float: 'left' }}><Spinner size={12} color={Colors.GRAY3} /></span> Testing</>}
                  </div>
                  <div
                    className='connection-actions'
                    style={{ paddingLeft: '20px' }}
                  >
                    <Button
                      className='connection-action-settings'
                      icon={
                        <Icon
                          icon='cog'
                          size={12}
                          color={Colors.BLUE4}
                          onClick={() => manageConnection(bC)}
                        />
                      }
                      color={Colors.BLUE3}
                      small
                      minimal
                      style={{
                        minWidth: '18px',
                        minHeight: '18px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </Card>

      <div className='mode-notice advanced-mode-notice'>
        <p>To customize how tasks are executed in the blueprint, please use <a href='#' rel='noreferrer' onClick={() => onAdvancedMode(true)}>Advanced Mode</a></p>
      </div>
    </div>
  )
}

export default DataConnections
