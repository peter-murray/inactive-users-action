// const github = require('@actions/github')
//   , core = require('@actions/core')
const fs = require('fs')
  , json2csv = require('json2csv')
  , OrganizationActivity = require('../src/OrganizationUserActivity')
  , githubClient = require('../src/github/githubClient')
  , dateUtil = require('../src/dateUtil')
  , yargs = require('yargs/yargs')
  , { hideBin } = require('yargs/helpers');
;

async function run(organization, days, maxRetries, output, format, token) {
  fromDate = dateUtil.convertDaysToDate(days);
  
  const octokit = githubClient.create(token, maxRetries)
    , orgActivity = new OrganizationActivity(octokit)
  ;

  console.error(`Attempting to generate organization user activity data, this could take some time...`);
  const userActivity = await orgActivity.getUserActivity(organization, fromDate);

  if (format == 'json') {
    writeOutput(JSON.stringify(userActivity.map(activity => activity.jsonPayload)), output)
    return
  }

  // Convert the JavaScript objects into a JSON payload so it can be output
  console.error(`User activity data captured, generating report...`);
  const data = userActivity.map(activity => activity.jsonPayload)
    , csv = json2csv.parse(data, {})
  ;

  writeOutput(csv, output)
}

function writeOutput(data, output) {
  if (output) {
    fs.writeFileSync(output, data);
    console.error(`User Activity Report Generated: ${output}`);
  } else {
    console.log(data);
    console.error(`User Activity Report Generated`);
  }
}

async function execute() {
  const argv = yargs(hideBin(process.argv))
    .command('$0 <organization>', 'Analyze user activity for a github organization', (yargs) => {
      yargs.positional('organization', {
        describe: 'Github organization to analyze',
        type: 'string'
      })
    })
    .option('days', {
      alias: 'd',
      description: 'How many days of recent activity to check',
      type: 'number',
      default: 180
    })
    .option('maxRetries', {
      alias: 'r',
      description: 'Maximum retries for the github API calls',
      type: 'number',
      default: 10
    })
    .option('token', {
      alias: 't',
      description: 'Github token. Will use the environment GH_TOKEN if not set.',
      type: 'string',
      demandOption : true
    })
    .option('output', {
      alias: 'o',
      description: 'Location to store the report. By default it will be printed to stdout.',
      type: 'string'
    })
    .option('format', {
      alias: 'f',
      description: 'Format of the report',
      type: 'string',
      choices: ['json', 'csv'],
      default: 'csv'
    })
    .help()
    .alias('help', 'h')
    .parse();
  
  const token = argv.token ? argv.token : process.env.GH_TOKEN;

  await run(argv.organization, argv.days, argv.maxRetries, argv.output, argv.format, token);
}
execute();
