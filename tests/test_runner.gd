extends Node
## Headless: godot --path . --headless res://tests/test_runner.tscn


func _ready() -> void:
	var ok := true
	ok = ok and _test_save_migrate()
	ok = ok and _test_day_cycle_format()
	ok = ok and _test_content_files_exist()
	ok = ok and _test_game_state_modifiers()
	print("test_runner: ", "PASS" if ok else "FAIL")
	get_tree().quit(0 if ok else 1)


func _test_save_migrate() -> bool:
	var d := {"version": 0}
	var m := SaveService.migrate(d)
	return int(m.get("version", 0)) >= 1 and m.has("loan")


func _test_day_cycle_format() -> bool:
	var s := DayCycle.get_effective_date_string()
	return s.length() == 10 and s[4] == "-" and s[7] == "-"


func _test_content_files_exist() -> bool:
	return FileAccess.file_exists("res://content/specials.json") \
		and FileAccess.file_exists("res://content/loans.json") \
		and FileAccess.file_exists("res://content/bands.json")


func _test_game_state_modifiers() -> bool:
	var p := GameState.get_special_modifier_product()
	var w := GameState.get_max_wager_multiplier()
	return p > 0.0 and w > 0.0 and w <= 1.0
