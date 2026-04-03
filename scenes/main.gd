extends Control

@onready var _credits: Label = %CreditsValue
@onready var _date: Label = %DateValue
@onready var _special: Label = %SpecialValue
@onready var _mods: Label = %ModifiersValue
@onready var _loan: Label = %LoanValue
@onready var _music: Label = %MusicValue
@onready var _cheat_amount: SpinBox = %CheatCredits
@onready var _audio_hint: Label = %AudioHint


func _ready() -> void:
	GameState.credits_changed.connect(_on_credits_changed)
	GameState.loan_changed.connect(_refresh_all)
	GameState.specials_applied.connect(_refresh_all)
	GameState.infusion_granted.connect(_on_infusion)
	MusicDirector.now_playing.connect(_on_music)
	%BtnSpend.pressed.connect(_on_spend_test_pressed)
	%LoanShort.pressed.connect(_on_loan_a_pressed)
	%LoanDeep.pressed.connect(_on_loan_b_pressed)
	%BtnEnterBar.pressed.connect(_on_enter_bar_pressed)
	%BtnGrant.pressed.connect(_on_cheat_grant_pressed)
	%BtnNextDay.pressed.connect(_on_cheat_day_pressed)
	%BtnSave.pressed.connect(_on_save_pressed)
	%BtnLoad.pressed.connect(_on_load_pressed)
	_refresh_all()
	_on_music({"title": "—", "band": "—", "kind": "idle"})


func _on_credits_changed(n: int) -> void:
	_credits.text = str(n)


func _on_infusion(amount: int) -> void:
	_audio_hint.text = "Daily stipend: +%d credits" % amount


func _on_music(info: Dictionary) -> void:
	var kind := str(info.get("kind", ""))
	var prefix := ""
	match kind:
		"interlude":
			prefix = "♪ Interlude — "
		"break":
			prefix = "☕ Break — "
		"track":
			prefix = "♫ "
		_:
			prefix = ""
	_music.text = "%s%s — %s" % [prefix, str(info.get("band", "")), str(info.get("title", ""))]


func _refresh_all() -> void:
	_credits.text = str(GameState.credits)
	_date.text = DayCycle.get_effective_date_string()
	var sp := GameState.get_today_special()
	if sp.is_empty():
		_special.text = "(none)"
	else:
		_special.text = "%s — %s" % [sp.get("title", ""), sp.get("id", "")]
	var pm := GameState.get_special_modifier_product()
	var wm := GameState.get_max_wager_multiplier()
	_mods.text = "Payout mult (special): ×%.2f   |   Max wager mult (debuffs): ×%.2f" % [pm, wm]
	if GameState.loan_is_active():
		var sec := GameState.get_loan_time_remaining_sec()
		var h := sec / 3600
		var m := (sec % 3600) / 60
		_loan.text = "%s — %dh %dm left" % [GameState.get_loan_debuff_label(), h, m]
	else:
		_loan.text = "No active loan."


func _on_save_pressed() -> void:
	SaveService.save_from(GameState)
	_audio_hint.text = "Saved."


func _on_load_pressed() -> void:
	SaveService.load_apply(GameState)
	GameState.try_daily_infusion()
	GameState.emit_signal("specials_applied")
	MusicDirector.restart_for_new_day()
	_refresh_all()
	_audio_hint.text = "Reloaded from disk."


func _on_loan_a_pressed() -> void:
	if GameState.take_loan("short_pour"):
		_refresh_all()


func _on_loan_b_pressed() -> void:
	if GameState.take_loan("deep_glass"):
		_refresh_all()


func _on_cheat_grant_pressed() -> void:
	GameState.cheat_grant_credits(int(_cheat_amount.value))
	_refresh_all()


func _on_cheat_day_pressed() -> void:
	GameState.cheat_advance_calendar_day()
	_refresh_all()


func _on_enter_bar_pressed() -> void:
	MusicDirector.unlock_audio_if_needed()
	MusicDirector.start_if_idle()
	_audio_hint.text = "Audio unlocked (web-safe gesture)."


func _on_spend_test_pressed() -> void:
	if GameState.spend_credits(10):
		SaveService.save_from(GameState)
	_refresh_all()
