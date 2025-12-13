# Patchnotes

I try to have the Patchnotes Human-Readable. Not sure if this will be up to date or if i will constantly use it.

## Beta

- Boss Statistics
- Weapon Statistics

WIP

## Alpha

- local file analysis
- file upload

### File Review

This is a "local" running analysis tool. The user (you) dont upload anything, the website simply provides the script. It reads your file locally and doesnt upload it to any server.

Currently its pushing the full CSV (log) into an arquero-vectorized table and than does some magic.

### Upload

The upload is working by using the given file, making an SHA sum of it and zipping it into .gz. Since I do not have the capabilitys to differntiate so much between verified uploads and non-verified uploads i decided to have a cloudflare worker, that uploads it to a private repository, there all the comments are currently stored and the file as SHA.gz. If a duplicate is uploaded the user (you) will simply get an error.