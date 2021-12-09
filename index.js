const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , fsUtil = require('./src/fsUtil')
  , OrganizationActivity = require('./src/OrganizationUserActivity')
  , githubClient = require('./src/github/githubClient')
  , dateUtil = require('./src/dateUtil')
;

async function run() {
  const since = core.getInput('since')
    , days = core.getInput('activity_days')
    , token = getRequiredInput('token')
    , outputDir = getRequiredInput('outputDir')
    , organization = getRequiredInput('organization')
    , maxRetries = getRequiredInput('octokit_max_retries')
    , debug = core.getInput('debug') === 'true'
  ;

  let fromDate;
  if (since) {
    core.info(`Since Date has been specified, using that instead of active_days`)
    fromDate = dateUtil.getFromDate(since);
  } else {
    fromDate = dateUtil.convertDaysToDate(days);
  }

  // Ensure that the output directory exists before we our limited API usage
  await io.mkdirP(outputDir)

  const octokit = githubClient.create(token, maxRetries)
    , orgActivity = new OrganizationActivity(octokit, core)
  ;

  core.info(`Attempting to generate organization user activity data, this could take some time...`);
  const userActivity = await orgActivity.getUserActivity(organization, fromDate, debug);
  saveIntermediateData(outputDir, userActivity.map(activity => activity.jsonPayload));

  // Convert the JavaScript objects into a JSON payload so it can be output
  console.log(`User activity data captured, generating report...`);
  const data = userActivity.map(activity => activity.jsonPayload)
    , csv = json2csv.parse(data, {})
  ;

  fsUtil.saveOutputFile(outputDir, 'organization_user_activity.csv', csv, 'report_csv');
}

async function execute() {
  try {
    await run();
  } catch (err) {
    core.setFailed(err.message);
  }
}
execute();


function getRequiredInput(name) {
  return core.getInput(name, {required: true});
}

function saveIntermediateData(directory, data) {
  fsUtil.saveOutputFile(directory, 'organization_user_activity.json', JSON.stringify(data), 'report_json');
}