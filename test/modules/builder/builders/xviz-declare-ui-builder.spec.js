// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import test from 'tape-catch';
import {XVIZUIBuilder} from '@xviz/builder';
import {XVIZValidator} from '@xviz/schema';

const schemaValidator = new XVIZValidator();

function validateUIBuilderOutput(results) {
  for (const name in results) {
    if (results.hasOwnProperty(name)) {
      schemaValidator.validate('declarative-ui/panel', results[name]);
    }
  }
}

test('XVIZBaseUIBuilder', t => {
  const builder = new XVIZUIBuilder({});

  const panel = builder.panel({name: 'Metrics Panel'});
  const container = builder.container({name: 'Metrics Container 1'});
  const metrics1 = builder.metric({
    streams: ['/vehicle/velocity'],
    title: 'Velocity'
  });
  const metrics2 = builder.metric({
    streams: ['/vehicle/acceleration'],
    title: 'Acceleration'
  });

  container.child(metrics1);
  container.child(metrics2);
  builder.child(panel).child(container);

  const expected = {
    'Metrics Panel': {
      type: 'PANEL',
      children: [
        {
          type: 'CONTAINER',
          children: [
            {
              type: 'METRIC',
              streams: ['/vehicle/velocity'],
              title: 'Velocity'
            },
            {
              type: 'METRIC',
              streams: ['/vehicle/acceleration'],
              title: 'Acceleration'
            }
          ],
          name: 'Metrics Container 1'
        }
      ],
      name: 'Metrics Panel'
    }
  };

  const actual = builder.getUI();

  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  validateUIBuilderOutput(actual);

  t.end();
});

test('XVIZUIBuilder#plot standard', t => {
  const builder = new XVIZUIBuilder({});
  const panel = builder.panel({name: 'Plots'});
  const select1 = builder.plot({
    title: 'Standard Plot',
    independentVariable: '/plan/distance',
    dependentVariables: ['/plan/cost']
  });
  builder.child(panel).child(select1);

  const expected = {
    Plots: {
      name: 'Plots',
      type: 'PANEL',
      children: [
        {
          type: 'PLOT',
          title: 'Standard Plot',
          independentVariable: '/plan/distance',
          dependentVariables: ['/plan/cost']
        }
      ]
    }
  };

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  validateUIBuilderOutput(actual);

  t.end();
});

test('XVIZUIBuilder#plot region', t => {
  const builder = new XVIZUIBuilder({});
  const panel = builder.panel({name: 'Plots'});
  const select1 = builder.plot({
    title: 'Region Plot',
    regions: [
      {
        x: '/plan/obs/x',
        yMin: '/plan/obs/y_min',
        yMax: '/plan/obs/y_max'
      }
    ]
  });
  builder.child(panel).child(select1);

  const expected = {
    Plots: {
      name: 'Plots',
      type: 'PANEL',
      children: [
        {
          type: 'PLOT',
          title: 'Region Plot',
          regions: [
            {
              x: '/plan/obs/x',
              yMin: '/plan/obs/y_min',
              yMax: '/plan/obs/y_max'
            }
          ]
        }
      ]
    }
  };

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  validateUIBuilderOutput(actual);

  t.end();
});

test('XVIZUIBuilder#select', t => {
  const builder = new XVIZUIBuilder({});

  const panel = builder.panel({name: 'Controls'});
  const select1 = builder.select({
    title: 'Choose options value',
    stream: '/options/value',
    target: '/import/setting'
  });

  builder.child(panel).child(select1);

  const expected = {
    Controls: {
      name: 'Controls',
      type: 'PANEL',
      children: [
        {
          type: 'SELECT',
          title: 'Choose options value',
          stream: '/options/value',
          onchange: {
            target: '/import/setting'
          }
        }
      ]
    }
  };

  const actual = builder.getUI();

  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  for (const name in actual) {
    if (actual.hasOwnProperty(name)) {
      schemaValidator.validate('declarative-ui/panel', actual[name]);
    }
  }

  t.end();
});
