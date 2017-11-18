@echo off

mkdir encryption > NUL 2>&1
cd encryption
openssl req -new -newkey rsa:2048 -nodes -out coffeecat.csr -keyout coffeecat.key
openssl  x509 -req -days 3650 -in coffeecat.csr -signkey coffeecat.key -out coffeecat.crt
cd ..