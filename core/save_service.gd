extends Node
## Versioned persistence under user:// (native + web storage for HTML5 export).

const SAVE_PATH := "user://villains_club_save.json"
const CURRENT_VERSION := 1

signal saved
signal loaded


func _default_data() -> Dictionary:
	return {
		"version": CURRENT_VERSION,
		"credits": 100,
		"last_infusion_date": "",
		"loan": {},
		"debug_calendar_offset_days": 0,
	}


func load_apply(game_state: Node) -> void:
	var raw := _read_json_file()
	if raw.is_empty():
		game_state.from_save_dict(_default_data())
		emit_signal("loaded")
		return
	raw = migrate(raw)
	game_state.from_save_dict(raw)
	emit_signal("loaded")


func save_from(game_state: Node) -> void:
	var raw_save: Variant = game_state.to_save_dict()
	if typeof(raw_save) != TYPE_DICTIONARY:
		push_error("SaveService: to_save_dict must return a Dictionary.")
		return
	var data: Dictionary = raw_save
	data["version"] = CURRENT_VERSION
	var path := SAVE_PATH
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		push_error("SaveService: cannot write %s — %s" % [path, FileAccess.get_open_error()])
		return
	f.store_string(JSON.stringify(data, "\t"))
	emit_signal("saved")


func migrate(data: Dictionary) -> Dictionary:
	var v := int(data.get("version", 0))
	if v < 1:
		data["version"] = 1
	if not data.has("loan"):
		data["loan"] = {}
	if not data.has("debug_calendar_offset_days"):
		data["debug_calendar_offset_days"] = 0
	return data


func _read_json_file() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return {}
	var text := f.get_as_text()
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("SaveService: corrupt save, resetting.")
		return {}
	return parsed
