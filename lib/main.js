"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const github = require('@actions/github');
const core = require('@actions/core');
const fs = require('fs');
const myToken = core.getInput('myToken');
const octokit = new github.GitHub(myToken);
const repoInfo = github.context.repo;
const run = () => __awaiter(this, void 0, void 0, function* () {
    const imageAsBase64 = fs.readFileSync('./8765i.jpg', 'base64');
    const blob = yield octokit.git.createBlob(Object.assign({}, repoInfo, { content: imageAsBase64, encoding: 'base64' }));
    const heads = yield octokit.git.listRefs(Object.assign({}, repoInfo, { namespace: 'heads/' }));
    for (let head of heads.data) {
        core.debug(`Caginating ${head.ref}`);
        const headCommit = yield octokit.git.getCommit(Object.assign({}, repoInfo, { commit_sha: head.object.sha }));
        let tree = yield octokit.git.getTree(Object.assign({}, repoInfo, { tree_sha: headCommit.data.tree.sha, recursive: 1 }));
        for (let object of tree.data.tree) {
            core.debug(`  Caginating ${object.path}`);
            object.sha = blob.data.sha;
        }
        const newTree = yield octokit.git.createTree(Object.assign({}, repoInfo, { tree: tree.data.tree }));
        const newCommit = yield octokit.git.createCommit(Object.assign({}, repoInfo, { tree: newTree.data.sha, message: 'Caginate', parents: [headCommit.data.sha] }));
        yield octokit.git.updateRef(Object.assign({}, repoInfo, { ref: head.ref, sha: newCommit.data.sha }));
    }
});
run();
