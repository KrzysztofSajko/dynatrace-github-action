/*
Copyright 2024 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

// Local-only smoke test against a classic Dynatrace tenant. Never run in CI -
// credentials are read from the local environment and must never be
// committed. See README.md > Local Development > Smoke Testing.

// eslint-disable-next-line import/extensions -- required for Node's native TypeScript execution
import * as dt from '../src/dynatrace.ts'
// eslint-disable-next-line import/extensions, import/no-unresolved -- required for Node's native TypeScript execution
import { requireEnv, scenario } from './smoke-lib.mts'

async function main(): Promise<void> {
  const url = requireEnv('DT_CLASSIC_URL')
  const token = requireEnv('DT_CLASSIC_TOKEN')
  const entitySelector = process.env.DT_ENTITY_SELECTOR ?? 'type(HOST)'

  await scenario('classic tenant: entitySelector', async () =>
    dt.sendEvents(url, token, [
      {
        title: 'Smoke test: entitySelector',
        type: 'CUSTOM_INFO',
        entitySelector,
        properties: { source: 'smoke-test' }
      }
    ])
  )

  await scenario('classic tenant: metric', async () =>
    dt.sendMetrics(url, token, [{ metric: 'github.smoke_test', value: '1.0' }])
  )

  console.log('\nDone. Cross-check the event/metric in the classic tenant.')
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
