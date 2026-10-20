<?php
// development entry point of the Modern Blue design, browse to adminer/modern-blue.php
// a database server without a password (e.g. a fresh XAMPP) can be accessed after creating
// modern-blue-password.php containing: <?php return password_hash("your-password", PASSWORD_DEFAULT);
function adminer_object() {
	include_once "../plugins/modern-blue.php";
	$plugins = array(new AdminerModernBlue);
	if (file_exists("modern-blue-password.php")) {
		$plugins[] = new Adminer\Password(include "./modern-blue-password.php");
	}
	return new Adminer\Plugins($plugins);
}

include "./index.php";
