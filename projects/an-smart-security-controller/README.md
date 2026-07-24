# A&N Smart Security Controller

ระบบสัญญาณกันขโมยแบบโมดูลาร์สำหรับร้านค้า สำนักงาน และชุด DIY ภายใต้ A&N 3D MAX

**Project status:** Concept / specification  
**Recorded:** 2026-07-25  
**Target platform:** ESP32 / ESP32-S3 + PlatformIO  
**Primary integration:** MQTT, n8n, LINE OA, Home Assistant

## Objectives

1. สร้างต้นแบบระบบกันขโมยแบบมีสายที่ทำงานได้แม้อินเทอร์เน็ตล่ม
2. รองรับ 8–16 zones, battery backup, siren, keypad/RFID และ event log
3. พัฒนาเป็น custom PCB และ enclosure ที่ผลิตด้วย 3D printing
4. ประเมินการต่อยอดเป็น DIY kit และบริการติดตั้ง

## V1 Scope

- Magnetic contacts, PIR, vibration and tamper inputs
- NC/NO zones and planned End-of-Line resistor supervision
- Armed Away, Armed Stay, Exit Delay, Entry Delay and Alarm states
- 12V siren and strobe outputs through isolated relay or MOSFET drivers
- 12V SLA battery backup and automatic charging
- RTC and persistent event logging
- MQTT event publishing
- n8n and LINE OA notifications
- Local keypad/RFID control
- Local operation when Wi-Fi or internet is unavailable
- OTA update with rollback planning

## Deferred to V2

- Ethernet
- LTE/4G backup
- RS-485 zone expanders
- Camera snapshot integration
- Multi-site cloud dashboard
- Dedicated mobile application

## Proposed Architecture

```text
Sensors / EOL loops
        |
        v
Input protection / zone interface
        |
        v
ESP32-S3 controller ---- RTC / SD event log
        |       |
        |       +---- Wi-Fi / MQTT / Local Web UI
        |
        +---- MOSFET or isolated relay ---- Siren / Strobe
        |
        +---- Keypad / RFID / LEDs / Buzzer

12V PSU ---- Battery charger ---- 12V SLA
   |
   +---- 12V alarm loads
   +---- Buck converter 5V/3.3V logic
```

## Proposed State Machine

```text
DISARMED
  -> EXIT_DELAY
  -> ARMED_AWAY / ARMED_STAY
  -> ENTRY_DELAY
  -> ALARM
  -> DISARMED

Any state may enter:
- FAULT
- MAINTENANCE
- POWER_BACKUP
```

## Initial BOM Categories

### Controller

- ESP32-S3 development board x2
- DS3231 RTC x1
- MicroSD module and 8–32GB card x1
- 4x4 keypad x1
- RC522 reader x1
- RFID cards/tags x10
- LEDs, active buzzer and push buttons

### Sensors

- Wired magnetic contacts x6
- PIR sensors x4
- Vibration sensors x2–4
- Tamper switches x2
- Certified dry-contact smoke detector x1 for actual deployment
- Water leak sensor x1
- EOL resistor assortment

### Outputs

- 12V siren 110–120dB x2
- 12V strobe x1
- Isolated relay or MOSFET output modules
- Flyback diodes and separate output fuses

### Power

- 12V 5A regulated power supply
- 12V 7Ah SLA battery
- Alarm/UPS battery charger board
- 12V-to-5V buck converters x2
- Main and branch fuse holders
- Reverse-polarity protection
- Low-voltage cutoff
- Distribution terminal blocks

### Installation

- Lockable ABS or metal enclosure
- DIN rail and terminals
- Cable glands
- 4C/6C alarm cable or 22AWG cable
- Cable duct, ferrules, heat shrink, labels and cable ties
- 3D-printed PETG mounting brackets

> All prices must be researched again immediately before procurement. The earlier July 2026 estimate was THB 6,000–9,000 for a full wired V1 prototype excluding cameras and LTE.

## Firmware Layout

```text
firmware/
├── src/
│   ├── main.cpp
│   ├── alarm_state_machine.cpp
│   ├── zone_manager.cpp
│   ├── power_manager.cpp
│   ├── mqtt_client.cpp
│   ├── event_logger.cpp
│   ├── access_control.cpp
│   └── ota_manager.cpp
├── include/
├── config/
├── test/
└── platformio.ini
```

## MQTT Draft

```text
an-security/{site_id}/status
an-security/{site_id}/zone/{zone_id}/state
an-security/{site_id}/event
an-security/{site_id}/power
an-security/{site_id}/heartbeat
an-security/{site_id}/command/arm
an-security/{site_id}/command/disarm
an-security/{site_id}/command/silence
```

Remote disarm must not be exposed directly to the public internet. It requires authenticated commands, replay protection, audit logging and a local fallback.

## Development Plan

### Phase 0 — Requirements

- Create physical zone map
- Freeze zone count and operating modes
- Define backup-runtime requirement
- Decide Wi-Fi-only versus Ethernet/LTE roadmap

### Phase 1 — Breadboard Prototype

- Read magnetic contact and PIR inputs
- Implement debounce and state machine
- Test exit/entry delays
- Drive 12V siren safely
- Test watchdog and brownout recovery

### Phase 2 — Power and Safety

- Build 12V battery-backed supply
- Measure normal and alarm current
- Verify automatic mains/battery switching
- Test fuse, reverse-polarity and low-voltage protection

### Phase 3 — Communications

- Implement MQTT topics
- Connect n8n and LINE OA
- Add heartbeat and offline alerting
- Add local web interface

### Phase 4 — Enclosure and Pilot

- Design PETG internal mounts
- Label all zones and terminals
- Install in a real site
- Run commissioning checklist
- Conduct 14–30 day pilot

### Phase 5 — Custom PCB

- 16 supervised zone inputs
- Input protection or opto-isolation
- MOSFET alarm outputs
- Power and battery monitoring
- Prototype quantity: 3–5 boards

### Phase 6 — Productization

- User and installer manuals
- False-alarm and burn-in testing
- Manufacturing cost model
- DIY kit and installation pricing
- Electrical, radio and product compliance review before sale

## V1 Acceptance Criteria

- Operates continuously for at least 14 days without lockup
- Correctly detects door and PIR events
- False alarm rate below one per seven days during pilot
- Automatically switches to battery power
- Sends an online notification within 10 seconds under normal connectivity
- Siren remains functional without Wi-Fi or internet
- Event log survives restart
- Local arm/disarm works through keypad or RFID

## Important Safety Notes

- Do not power a siren directly from ESP32 GPIO
- Place fuses close to the mains supply and battery
- Use a certified smoke detector rather than MQ-2 for life-safety use
- Cheap relay boards require load, temperature and endurance testing
- Cloud disarm increases attack surface
- The DIY prototype must not be marketed as certified commercial security equipment before testing and compliance review

## Next Actions

1. Survey the intended installation site and create a zone map
2. Recheck the current market price of every BOM item
3. Select the exact ESP32-S3 board and power architecture
4. Buy the breadboard prototype parts
5. Initialize PlatformIO firmware
6. Implement and test the state machine
7. Design the enclosure and 3D-printed mounts
8. Run a 14-day pilot before permanent installation
