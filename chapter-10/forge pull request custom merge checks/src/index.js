import api, { route } from "@forge/api";

export const run = async (event, context) => {
  console.log(JSON.stringify(event, null, 2));

  const workspaceUuid = event.workspace.uuid;
  const repoUuid = event.repository.uuid;
  const prId = event.pullrequest.id;

  // Fetch the pull request details to get source and destination branches
  const prDetailsUrl = route`/2.0/repositories/${workspaceUuid}/${repoUuid}/pullrequests/${prId}`;
  const prDetailsResponse = await api.asApp().requestBitbucket(prDetailsUrl);
  const prDetails = await prDetailsResponse.json();

  const sourceBranch = prDetails.source?.branch?.name;
  const destinationBranch = prDetails.destination?.branch?.name;

  if (!sourceBranch || !destinationBranch) {
    return { success: false, message: "Could not determine source or destination branch" };
  }

  const commits = await fetchCommits(workspaceUuid, repoUuid, sourceBranch, destinationBranch);

  let success = true;
  let message = "All commit authors have an email domain of 'gmail.com'";

  for (const commit of commits) {
    const email = commit.author.raw.split('<')[1].split('>')[0];
    if (!email.endsWith('@gmail.com')) {
      success = false;
      message = `Commit by ${commit.author.raw} has an invalid email domain`;
      console.log(`Invalid commit found: ${commit.hash}, Author: ${commit.author.raw}`);
      break;
    }
  }

  return { success, message };
};

const fetchCommits = async (workspaceUuid, repoUuid, sourceBranch, destinationBranch) => {
  let nextPageUrl = route`/2.0/repositories/${workspaceUuid}/${repoUuid}/commits?include=${sourceBranch}&exclude=${destinationBranch}&fields=values.hash,values.author.raw,next&pagelen=100`;
  const commits = [];

  while (nextPageUrl) {
    const res = await api.asApp().requestBitbucket(nextPageUrl);
    const pageJson = await res.json();
    commits.push(...pageJson.values);
    nextPageUrl = pageJson.next ? route`${pageJson.next}` : null;
  }

  return commits;
};
