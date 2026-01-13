#!/bin/bash
cd /tmp/kavia/workspace/code-generation/simple-to-do-list-7887-7896/to_do_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

