#!/bin/bash

SOURCE_PATH=$1
DEST_PATH=$2

echo "PARAMETERS"
echo "$SOURCE_PATH"
echo "$DEST_PATH"

# copy from build to user path
cp -a $SOURCE_PATH $DEST_PATH