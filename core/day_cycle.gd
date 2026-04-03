extends Node
## Local calendar day and optional debug offset (cheats / QA).

var debug_calendar_offset_days: int = 0


func get_effective_date_string() -> String:
	var unix := int(Time.get_unix_time_from_system()) + debug_calendar_offset_days * 86400
	var t := Time.get_datetime_dict_from_unix_time(unix)
	return "%04d-%02d-%02d" % [int(t.year), int(t.month), int(t.day)]


func set_debug_offset_days(offset: int) -> void:
	debug_calendar_offset_days = offset


func advance_debug_one_day() -> void:
	debug_calendar_offset_days += 1
