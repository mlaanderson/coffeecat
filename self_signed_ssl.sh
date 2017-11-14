#!/bin/bash

mkdir encryption 2> /dev/null
cd encryption
/usr/bin/openssl req -new -newkey rsa:2048 -nodes -out coffeecat.csr -keyout coffeecat.key
/usr/bin/openssl  x509 -req -days 3650 -in coffeecat.csr -signkey coffeecat.key -out coffeecat.crt
cd -