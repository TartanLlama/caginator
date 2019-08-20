const github = require('@actions/github');
const core = require('@actions/core');

const myToken = core.getInput('myToken');

const octokit = new github.GitHub(myToken);

const repoInfo = github.context.repo;

const run = async () => {
  const blob = await octokit.git.createBlob({ ...repoInfo, content: 'Hello' });
  const heads = await octokit.git.listRefs({ ...repoInfo, namespace: 'heads/' });

  for (let head of heads.data) {
    core.debug(`Caginating ${head.ref}`);
    const headCommit = await octokit.git.getCommit({ ...repoInfo, commit_sha: head.object.sha });
    let tree = await octokit.git.getTree({ ...repoInfo, tree_sha: headCommit.data.tree.sha, recursive: 1 });

    for (let object of tree.data.tree) {
      core.debug(`  Caginating ${object.path}`);
      object.sha = blob.data.sha;
    }

    const newTree = await octokit.git.createTree({ ...repoInfo, tree: tree.data.tree });
    const newCommit = await octokit.git.createCommit({ ...repoInfo, tree: newTree.data.sha, message: 'Caginate', parents: [headCommit.data.sha] });
    await octokit.git.updateRef({ ...repoInfo, ref: head.ref, sha: newCommit.data.sha });
  }
}

run();
