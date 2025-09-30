<?php
// Usage: php generate_admin_hash.php your_password_here
if ($argc < 2) {
    echo "Usage: php generate_admin_hash.php <password>\n";
    exit(1);
}
$password = $argv[1];
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "BCRYPT HASH:\n" . $hash . PHP_EOL;
