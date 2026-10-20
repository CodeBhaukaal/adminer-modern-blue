<?php

/** Modern Blue design: navy sidebar, light workspace, login card and Motion animations
* Copy the directory modern-blue/ next to this file, the plugin links its CSS and JavaScript from there.
* @link https://www.adminer.org/plugins/#use
* @license https://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
* @license https://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
*/
class AdminerModernBlue extends Adminer\Plugin {
	protected $assets;
	protected $motion;

	/**
	* @param string $assets URL of the directory with modern-blue.css, modern-blue.js and motion.min.js, autodetected from the plugin location by default
	* @param bool $motion animate the interface by the bundled Motion library
	*/
	function __construct($assets = "", $motion = true) {
		$this->assets = ($assets != "" ? rtrim($assets, "/") . "/" : $this->detectAssets());
		$this->motion = $motion;
	}

	/** Get URL of the asset directory relative to the current script */
	private function detectAssets() {
		$from = explode("/", str_replace("\\", "/", getcwd()));
		$to = explode("/", str_replace("\\", "/", __DIR__ . "/modern-blue"));
		$windows = (DIRECTORY_SEPARATOR == "\\"); // drive letters and paths are case insensitive there
		while ($from && $to && ($windows ? !strcasecmp($from[0], $to[0]) : $from[0] === $to[0])) {
			array_shift($from);
			array_shift($to);
		}
		return str_repeat("../", count($from)) . implode("/", $to) . "/";
	}

	/** Get URL of an asset with a version parameter refreshing the browser cache after an update */
	private function asset($filename) {
		$path = __DIR__ . "/modern-blue/$filename";
		return $this->assets . $filename . (file_exists($path) ? "?v=" . dechex(filemtime($path) ^ filesize($path)) : "");
	}

	function css() {
		$return = array($this->asset("modern-blue.css") => "light");
		foreach (array("", "-dark") as $mode) {
			$filename = "adminer$mode.css"; // a user skin still applies on top of this design
			if (file_exists($filename)) {
				$return["$filename?v=" . crc32(file_get_contents($filename))] = ($mode ? "dark" : "light");
			}
		}
		return $return;
	}

	function head($dark = null) {
		$strings = array();
		foreach (array('Search databases…', 'Search tables…', 'Action', 'Select', 'Structure', 'Alter', 'Select data', 'Show structure', 'Alter table', 'Columns', 'error', 'errors', 'OK', 'Edit', 'Copy', 'Delete', 'Browse', 'Insert', 'Empty', 'Drop', 'Tip: double-click a cell to edit it, then press Save.', 'Export', 'Color theme', 'Saved in this browser.', 'Ocean Blue', 'Emerald', 'Violet', 'Sunset', 'Rose', 'Graphite', 'Daylight', 'Midnight (dark)', 'Database', 'Database & schema', 'Tools', 'Tables', 'Recent', 'Press', 'to search tables', 'Collapse sidebar', 'Expand sidebar', 'Databases', 'Loading…', 'No items', 'Unable to load', 'New table', 'New database', 'Collapse all', 'Search databases & tables…') as $key) {
			$strings[$key] = $this->lang($key);
		}
		// mb-preload hides the workspace until modern-blue.js animates it in, CSS reveals it anyway if the script fails
		// the colour template and the collapsed sidebar are chosen per browser, apply them before the first paint
		echo Adminer\script("try {\n\tvar mbTheme = localStorage.getItem('mb-theme');\n\tif (mbTheme) {\n\t\tdocument.documentElement.setAttribute('data-mb-theme', mbTheme);\n\t}\n"
			. "\tif (localStorage.getItem('mb-collapsed')) {\n\t\tdocument.documentElement.classList.add('mb-collapsed');\n\t}\n} catch (e) {\n}\n"
			. ($this->motion ? "document.documentElement.classList.add('mb-preload');\n" : "")
			. "var mbStrings = " . json_encode($strings) . ";");
		if ($this->motion) {
			echo Adminer\script_src($this->asset("motion.min.js"), true);
		}
		echo Adminer\script_src($this->asset("modern-blue.js"), true);
		echo "<meta name='theme-color' content='#132d50'>\n";
	}

	function bodyClass() {
		$page = (Adminer\DB != "" ? "db" : "server");
		if (isset($_GET["import"])) {
			$page = "import";
		} else {
			// the same order as the routing in adminer/index.php
			$pages = array("download", "table", "schema", "dump", "privileges", "sql", "edit", "create", "indexes", "database", "scheme", "call", "foreign", "view", "event", "procedure", "sequence", "type", "check", "trigger", "user", "processlist");
			foreach ($pages as $key) {
				if (isset($_GET[$key])) {
					$page = $key;
					break;
				}
			}
			if ($page == "db" || $page == "server") {
				$page = ($_GET["select"] != "" ? "select" : (isset($_GET["variables"]) ? "variables" : (isset($_GET["script"]) ? "script" : $page)));
			}
		}
		echo " mb mb-page-$page" . (Adminer\connection() ? "" : " mb-login") . (Adminer\DB != "" ? " mb-in-db" : "");
	}

	function loginForm() {
		echo "<div class='mb-login-head'><h1><span class='mb-logo-mark' aria-hidden='true'></span>Adminer</h1>"
			. "<p>" . $this->lang('Database management made simple') . "</p></div>\n";
		echo "<p class='mb-login-foot'>Adminer · " . $this->lang('Lightweight database management') . "</p>\n";
	}

	function databasesPrint($missing) {
		$server = preg_replace('~\b(db|ns)=[^&]*&~', '', Adminer\ME);
		$active = (Adminer\DB == "" && !array_intersect_key($_GET, array_flip(array("sql", "import", "dump", "database", "privileges", "user", "processlist", "variables", "status"))));
		echo "<p class='mb-nav'><a href='" . Adminer\h(substr($server, 0, -1)) . "' class='mb-nav-server" . ($active ? " active" : "") . "'>"
			. $this->lang('Server') . "</a></p>\n";
	}

	function tableStructurePrint($fields, $tableStatus = null) {
		$comment = Adminer\support("comment");
		$user_types = (Adminer\support("type") ? Adminer\types() : array());
		$table = $_GET["table"];
		$alter = ($table != "" && function_exists('Adminer\alter_table') && !Adminer\is_view((array) $tableStatus));
		$link = Adminer\h(Adminer\ME) . "%s=" . Adminer\h(Adminer\url_escape($table));
		if ($alter) {
			echo "<p class='mb-structure-tools'>";
			echo "<a class='mb-tool mb-tool-insert' href='" . sprintf($link, "create") . "'><span>" . $this->lang('Add or change columns') . "</span></a>";
			echo (Adminer\support("indexes") ? "<a class='mb-tool mb-tool-structure' href='" . sprintf($link, "indexes") . "'><span>" . $this->lang('Indexes') . "</span></a>" : "");
			echo (Adminer\support("fkeys") ? "<a class='mb-tool mb-tool-alter' href='" . sprintf($link, "foreign") . "'><span>" . $this->lang('Add foreign key') . "</span></a>" : "");
			echo "<a class='mb-tool mb-tool-copy' href='" . sprintf($link, "edit") . "'><span>" . $this->lang('Insert row') . "</span></a>";
			echo "<a class='mb-tool mb-tool-browse' href='" . sprintf($link, "select") . "'><span>" . $this->lang('Browse') . "</span></a>";
			echo "</p>\n";
		}
		echo "<div class='scrollable'>\n<table class='nowrap odds mb-structure'>\n<thead><tr><th>#<th>" . $this->lang('Column') . "<th>" . $this->lang('Type')
			. "<th>" . $this->lang('Collation') . "<th>" . $this->lang('Null') . "<th>" . $this->lang('Default') . "<th>" . $this->lang('Extra')
			. ($comment ? "<th>" . $this->lang('Comment') : "") . ($alter ? "<th>" . $this->lang('Action') : "") . "<tbody>\n";
		$i = 0;
		foreach ($fields as $field) {
			$type = Adminer\h($field["full_type"]);
			$extra = array();
			if ($field["auto_increment"]) {
				$extra[] = "AUTO_INCREMENT";
			}
			if ($field["on_update"]) {
				$extra[] = "ON UPDATE " . Adminer\h($field["on_update"]);
			}
			if ($field["generated"]) {
				$extra[] = Adminer\h($field["generated"]);
			}
			echo "<tr><td class='mb-muted'>" . ++$i;
			echo "<th>" . Adminer\h($field["field"]) . ($field["primary"] ? " <span class='mb-badge'>PK</span>" : "");
			echo "<td>" . (in_array($type, $user_types) ? "<a href='" . Adminer\h(Adminer\ME . 'type=' . Adminer\url_escape($type)) . "'>$type</a>" : $type);
			echo "<td class='mb-muted'>" . ($field["collation"] != "" ? Adminer\h($field["collation"]) : "–");
			echo "<td>" . ($field["null"] ? $this->lang('Yes') : $this->lang('No'));
			echo "<td>" . (isset($field["default"])
				? ($field["generated"]
					? "<code class='jush-" . Adminer\JUSH . "'>" . Adminer\shorten_utf8(preg_replace('~\s+~', ' ', ltrim($field["default"])), 80, "</code>")
					: Adminer\h($field["default"]))
				: "<i>" . ($field["null"] ? "NULL" : $this->lang('None')) . "</i>"
			);
			echo "<td class='mb-muted'>" . implode(", ", $extra);
			echo ($comment ? "<td>" . Adminer\adminer()->commentValue('COLUMN', $field["comment"]) : "");
			echo ($alter ? "<td class='mb-row-tools'><a class='mb-tool mb-tool-edit' href='" . sprintf($link, "create") . "' title='" . Adminer\h($this->lang('Change') . ": " . $field["field"]) . "'><span>" . $this->lang('Change') . "</span></a>" : "");
			echo "\n";
		}
		echo "</table>\n</div>\n";
		return true;
	}

	function tablesPrint($tables) {
		echo "<p class='mb-table-filter jsonly'><input type='search' id='mb-table-filter' placeholder='" . Adminer\h($this->lang('Search tables…')) . "'"
			. " aria-label='" . Adminer\h($this->lang('Search tables…')) . "' autocomplete='off'></p>\n";
	}

	protected $translations = array(
		'cs' => array(
			'' => 'Moderní modrý vzhled: tmavý postranní panel, světlá pracovní plocha a animace',
			'Database management made simple' => 'Jednoduchá správa databází',
			'Lightweight database management' => 'Odlehčená správa databází',
			'Server' => 'Server',
			'Search tables…' => 'Hledat tabulky…',
			'Search databases…' => 'Hledat databáze…',
			'Action' => 'Akce',
			'Select' => 'Vypsat',
			'Structure' => 'Struktura',
			'Alter' => 'Změnit',
			'Select data' => 'Vypsat data',
			'Show structure' => 'Zobrazit strukturu',
			'Alter table' => 'Pozměnit tabulku',
			'Columns' => 'Sloupce',
			'error' => 'chyba',
			'errors' => 'chyby',
			'Column' => 'Sloupec',
			'Type' => 'Typ',
			'Collation' => 'Porovnávání',
			'Null' => 'NULL',
			'Default' => 'Výchozí',
			'Extra' => 'Navíc',
			'Comment' => 'Komentář',
			'Yes' => 'Ano',
			'No' => 'Ne',
			'None' => 'Žádná',
		),
		'de' => array(
			'' => 'Modernes blaues Design: dunkle Seitenleiste, heller Arbeitsbereich und Animationen',
			'Database management made simple' => 'Datenbankverwaltung leicht gemacht',
			'Lightweight database management' => 'Schlanke Datenbankverwaltung',
			'Server' => 'Server',
			'Search tables…' => 'Tabellen suchen…',
			'Search databases…' => 'Datenbanken suchen…',
			'Action' => 'Aktion',
			'Select' => 'Auswählen',
			'Structure' => 'Struktur',
			'Alter' => 'Ändern',
			'Select data' => 'Daten auswählen',
			'Show structure' => 'Struktur anzeigen',
			'Alter table' => 'Tabelle ändern',
			'Columns' => 'Spalten',
			'error' => 'Fehler',
			'errors' => 'Fehler',
			'Column' => 'Spalte',
			'Type' => 'Typ',
			'Collation' => 'Kollation',
			'Null' => 'NULL',
			'Default' => 'Standard',
			'Extra' => 'Extra',
			'Comment' => 'Kommentar',
			'Yes' => 'Ja',
			'No' => 'Nein',
			'None' => 'Keiner',
		),
		'hi' => array(
			'' => 'मॉडर्न ब्लू डिज़ाइन: गहरा साइडबार, हल्का कार्यक्षेत्र और एनिमेशन',
			'Database management made simple' => 'डेटाबेस प्रबंधन अब आसान',
			'Lightweight database management' => 'हल्का डेटाबेस प्रबंधन',
			'Server' => 'सर्वर',
			'Search tables…' => 'टेबल खोजें…',
			'Search databases…' => 'डेटाबेस खोजें…',
			'Action' => 'क्रिया',
			'Select' => 'चुनें',
			'Structure' => 'संरचना',
			'Alter' => 'बदलें',
			'Select data' => 'डेटा चुनें',
			'Show structure' => 'संरचना दिखाएँ',
			'Alter table' => 'टेबल बदलें',
			'Columns' => 'कॉलम',
			'error' => 'त्रुटि',
			'errors' => 'त्रुटियाँ',
			'OK' => 'सफल',
			'Edit' => 'संपादित करें',
			'Copy' => 'कॉपी',
			'Delete' => 'हटाएँ',
			'Browse' => 'देखें',
			'Insert' => 'जोड़ें',
			'Empty' => 'खाली करें',
			'Drop' => 'मिटाएँ',
			'Tip: double-click a cell to edit it, then press Save.' => 'टिप: सेल बदलने के लिए डबल-क्लिक करें, फिर Save दबाएँ।',
			'Change' => 'बदलें',
			'Add or change columns' => 'कॉलम जोड़ें या बदलें',
			'Indexes' => 'इंडेक्स',
			'Add foreign key' => 'फ़ॉरेन की जोड़ें',
			'Insert row' => 'नई row जोड़ें',
			'Export' => 'एक्सपोर्ट',
			'Color theme' => 'रंग थीम',
			'Saved in this browser.' => 'इस ब्राउज़र में सेव रहेगा।',
			'Ocean Blue' => 'ओशन ब्लू',
			'Emerald' => 'एमरल्ड',
			'Violet' => 'वायलेट',
			'Sunset' => 'सनसेट',
			'Rose' => 'रोज़',
			'Graphite' => 'ग्रेफ़ाइट',
			'Daylight' => 'डेलाइट',
			'Midnight (dark)' => 'मिडनाइट (डार्क)',
			'Database' => 'डेटाबेस',
			'Database & schema' => 'डेटाबेस और स्कीमा',
			'Tools' => 'टूल्स',
			'Tables' => 'टेबल',
			'Recent' => 'हाल ही में',
			'Press' => 'दबाएँ',
			'to search tables' => 'टेबल खोजने के लिए',
			'Collapse sidebar' => 'साइडबार छोटा करें',
			'Expand sidebar' => 'साइडबार बड़ा करें',
			'Databases' => 'डेटाबेस',
			'Loading…' => 'लोड हो रहा है…',
			'No items' => 'कुछ नहीं',
			'Unable to load' => 'लोड नहीं हुआ',
			'New table' => 'नई टेबल',
			'New database' => 'नया डेटाबेस',
			'Collapse all' => 'सब बंद करें',
			'Search databases & tables…' => 'डेटाबेस और टेबल खोजें…',
			'Column' => 'कॉलम',
			'Type' => 'प्रकार',
			'Collation' => 'कोलेशन',
			'Null' => 'NULL',
			'Default' => 'डिफ़ॉल्ट',
			'Extra' => 'अतिरिक्त',
			'Comment' => 'टिप्पणी',
			'Yes' => 'हाँ',
			'No' => 'नहीं',
			'None' => 'कोई नहीं',
		),
	);
}
