extends Node
## Credits, daily stipend, data-driven specials, loans/debuffs. Minigames read modifiers via getters.

const STARTING_CREDITS := 100
const DAILY_INFUSION_AMOUNT := 50

var credits: int = STARTING_CREDITS
var last_infusion_date: String = ""
## Active loan: offer_id, credits_taken, expires_at_unix, debuff_id — empty if none.
var loan: Dictionary = {}

var _specials_root: Dictionary = {}
var _loans_root: Dictionary = {}

signal credits_changed(new_total: int)
signal loan_changed
signal infusion_granted(amount: int)
signal specials_applied


func _ready() -> void:
	_specials_root = _load_json("res://content/specials.json")
	_loans_root = _load_json("res://content/loans.json")
	SaveService.load_apply(self)
	try_daily_infusion()
	emit_signal("specials_applied")


func to_save_dict() -> Dictionary:
	return {
		"version": SaveService.CURRENT_VERSION,
		"credits": credits,
		"last_infusion_date": last_infusion_date,
		"loan": loan.duplicate(),
		"debug_calendar_offset_days": DayCycle.debug_calendar_offset_days,
	}


func from_save_dict(data: Dictionary) -> void:
	credits = int(data.get("credits", STARTING_CREDITS))
	last_infusion_date = str(data.get("last_infusion_date", ""))
	var l: Variant = data.get("loan", {})
	loan = l as Dictionary if typeof(l) == TYPE_DICTIONARY else {}
	DayCycle.debug_calendar_offset_days = int(data.get("debug_calendar_offset_days", 0))
	emit_signal("credits_changed", credits)
	emit_signal("loan_changed")


func add_credits(amount: int) -> void:
	if amount == 0:
		return
	credits = maxi(0, credits + amount)
	emit_signal("credits_changed", credits)


func spend_credits(amount: int) -> bool:
	if amount < 0 or credits < amount:
		return false
	credits -= amount
	emit_signal("credits_changed", credits)
	return true


func try_daily_infusion() -> void:
	var today := DayCycle.get_effective_date_string()
	if last_infusion_date == today:
		return
	last_infusion_date = today
	add_credits(DAILY_INFUSION_AMOUNT)
	emit_signal("infusion_granted", DAILY_INFUSION_AMOUNT)
	SaveService.save_from(self)


func get_today_special() -> Dictionary:
	var today := DayCycle.get_effective_date_string()
	var by_date: Variant = _specials_root.get("by_date", {})
	if typeof(by_date) == TYPE_DICTIONARY and by_date.has(today):
		return _resolve_special(str(by_date[today]))
	var cycle: Variant = _specials_root.get("fallback_cycle", [])
	if typeof(cycle) != TYPE_ARRAY or cycle.is_empty():
		return {}
	var defs: Variant = _specials_root.get("definitions", {})
	if typeof(defs) != TYPE_DICTIONARY:
		return {}
	var idx := _stable_day_index(today, cycle.size())
	var key := str(cycle[idx])
	if not defs.has(key):
		return {}
	var d: Dictionary = defs[key]
	return {"id": key, "title": str(d.get("title", key)), "modifier": d.get("modifier", {})}


func get_special_modifier_product() -> float:
	var spec := get_today_special()
	var mod: Variant = spec.get("modifier", {})
	if typeof(mod) != TYPE_DICTIONARY:
		return 1.0
	if str(mod.get("type", "")) != "payout_mult":
		return 1.0
	return float(mod.get("value", 1.0))


func get_max_wager_multiplier() -> float:
	var m := 1.0
	if loan_is_active():
		var debuff_id := str(loan.get("debuff_id", ""))
		var debuffs: Variant = _loans_root.get("debuffs", {})
		if typeof(debuffs) == TYPE_DICTIONARY and debuffs.has(debuff_id):
			var d: Dictionary = debuffs[debuff_id]
			var eff: Variant = d.get("effect", {})
			if typeof(eff) == TYPE_DICTIONARY and str(eff.get("type", "")) == "max_wager_mult":
				m *= float(eff.get("value", 1.0))
	return m


func get_loan_debuff_label() -> String:
	if not loan_is_active():
		return ""
	var debuff_id := str(loan.get("debuff_id", ""))
	var debuffs: Variant = _loans_root.get("debuffs", {})
	if typeof(debuffs) == TYPE_DICTIONARY and debuffs.has(debuff_id):
		return str(debuffs[debuff_id].get("title", debuff_id))
	return debuff_id


func can_take_loan() -> bool:
	return not loan_is_active()


func take_loan(offer_id: String) -> bool:
	if not can_take_loan():
		return false
	var offers: Variant = _loans_root.get("offers", [])
	if typeof(offers) != TYPE_ARRAY:
		return false
	for item in offers:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		if str(item.get("id", "")) != offer_id:
			continue
		var hours := float(item.get("duration_hours", 24.0))
		var cr := int(item.get("credits", 0))
		loan = {
			"offer_id": offer_id,
			"credits_taken": cr,
			"expires_at_unix": int(Time.get_unix_time_from_system() + hours * 3600.0),
			"debuff_id": str(item.get("debuff_id", "")),
		}
		add_credits(cr)
		emit_signal("loan_changed")
		SaveService.save_from(self)
		return true
	return false


func loan_is_active() -> bool:
	if loan.is_empty():
		return false
	var exp := int(loan.get("expires_at_unix", 0))
	if Time.get_unix_time_from_system() >= exp:
		if not loan.is_empty():
			loan = {}
			emit_signal("loan_changed")
			SaveService.save_from(self)
		return false
	return true


func cheat_grant_credits(amount: int) -> void:
	add_credits(amount)
	SaveService.save_from(self)


func cheat_advance_calendar_day() -> void:
	DayCycle.advance_debug_one_day()
	last_infusion_date = ""
	try_daily_infusion()
	_refresh_loan_expiry_check()
	emit_signal("specials_applied")
	MusicDirector.restart_for_new_day()
	SaveService.save_from(self)


func _refresh_loan_expiry_check() -> void:
	loan_is_active()


func get_loan_time_remaining_sec() -> int:
	loan_is_active()
	if loan.is_empty():
		return 0
	var exp := int(loan.get("expires_at_unix", 0))
	return maxi(0, int(exp - Time.get_unix_time_from_system()))


func _resolve_special(key: String) -> Dictionary:
	var defs: Variant = _specials_root.get("definitions", {})
	if typeof(defs) != TYPE_DICTIONARY or not defs.has(key):
		return {"id": key, "title": key, "modifier": {}}
	var d: Dictionary = defs[key]
	return {"id": key, "title": str(d.get("title", key)), "modifier": d.get("modifier", {})}


func _stable_day_index(date_str: String, cycle_len: int) -> int:
	if cycle_len <= 0:
		return 0
	var h := hash(date_str)
	return int(abs(h)) % cycle_len


func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("GameState: missing %s" % path)
		return {}
	var f := FileAccess.open(path, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}
