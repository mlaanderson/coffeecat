#!/bin/sh

#####################################################################################################################
# NPM installation on Linux is broken.                                                                              #
# What should work is this:                                                                                         #
#    npm install -g git+https://github.com/mlaanderson/coffeecat.git                                                #
#                                                                                                                   #
# Barring that, this at least should work:                                                                          #
#    npm install -g --unsafe git+https://github.com/mlaanderson/coffeecat.git                                       #
# Where --unsafe is needed to get the installation scripts to run with                                              #
# elevated permissions.                                                                                             #
#                                                                                                                   #
# But even when run as root, npm gets hung up on permissions creating files.                                        #
# So we have to use this workaround:                                                                                #
#    curl -sL https://raw.githubusercontent.com/mlaanderson/coffeecat/master/bin/install-linux.sh | sudo bash -E -  #
#####################################################################################################################

if [ $(id -u) -ne 0 ]; then
    echo Must be run as root
    exit 1
fi

NPM_PREFIX=$(npm config get prefix)
TMP_DIR=$(mktemp -d)

echo -n Installing coffeecat module in  ${NPM_PREFIX}/lib/node_modules ... 
git clone https://github.com/mlaanderson/coffeecat.git "${TMP_DIR}" > /dev/null 2>&1
npm install --global --unsafe "${TMP_DIR}" > /dev/null 2>&1
echo " DONE"

echo -n Removing the temporary folder
rm -rf "${TMP_DIR}"
echo " DONE"
