# Job application system + drafts

_Kept at repo root (not under `public/`) so it is not web-served. Personal notes and candid fit assessments — do not move into `public/level-design/`._

## Two reusable CVs (stop hand-tailoring per company)

- **`public/level-design/cv_generic.html`** — level-designer-first. Default for level-design roles and open applications.
- **`public/level-design/cv_generic_dev.html`** — gameplay/generalist-developer-first (leads with C#/gameplay systems, jams). Use for gameplay programmer / technical / generalist roles.

Both are em-dash-free and carry no company specifics. Tailoring now happens in the cover letter's opening line, not the CV.

---

## Cover-letter templates (fill the [BRACKETS], ~10 min)

### Template A — level design / open application
> Hi [name/team],
>
> I'm applying through your open application. I'm a level designer based in Bruges[, and your remote setup works well / — I can travel to LOCATION]. I completed CGMA's Level Design for Games (mentored by Shane Canning, senior LD at Insomniac/Square Enix) and back it with 7 years as a professional software developer, so I design levels in Unreal and script the systems behind them in Blueprint myself.
>
> [ONE genuine sentence about their game or value — a named title, a stated value.]
>
> I've attached my CV, and I'd point you to my portfolio and showreel at https://liamswift.com/level-design/.
>
> I'd love to chat about how I could contribute. Wishing you all the best!
>
> Liam Dobbelaere — liam.dobbelaere@outlook.com — +32 471 43 76 55

### Template B — gameplay / technical / generalist
> Hi [name/team],
>
> I'm applying for the [role]. I'm a gameplay-focused developer with 7 years of professional software experience, working day to day in C#, and I'm based in Bruges[ / remote works well]. On Monica's Paradox (Unity, Steam) I implemented all the gameplay systems and interactions in C# myself, and I care about clean, scalable architecture that holds up as features pile on.
>
> [ONE genuine sentence about their game/tech + honest flag of any gap.]
>
> You can see my Unity work at https://liamswift.com/level-design/ and my jam games at liam-swift.itch.io. CV attached.
>
> I'd love to chat about the project. Wishing you all the best!
>
> Liam Dobbelaere — liam.dobbelaere@outlook.com — +32 471 43 76 55

_(Note: use `·` or commas, not em dashes — the `—` above are just template separators, swap them out.)_

---

## Ready drafts

### Spellware Studios — Gameplay Programmer (freelance, remote) — APPLY
Email: **contact@spellwarestudios.com** · CV: `cv_generic_dev.html` · (confirm the role is still open, listing ~2 months old)

> Hi Spellware team,
>
> I'm applying for the freelance Gameplay Programmer role on your automation title. I'm based in Bruges, so the remote setup works well.
>
> I'm a gameplay-focused developer with 7 years of professional software experience, working day to day in C#. On Monica's Paradox (Unity, Steam) I implemented all the gameplay systems and interactions in C# myself, and I care about clean, scalable architecture that holds up as features pile on, which is exactly what an automation game demands.
>
> I'll be straight about one thing: my C# and Unity gameplay work is strong, but I haven't shipped with ECS/DOTS/Burst specifically. It's a paradigm I'm keen to work in, and seven years of production software means I get up to speed on new architectures quickly. If deep DOTS experience is a hard requirement from day one, I'd rather flag it now than waste your time.
>
> An automation title is the kind of systems-driven design I enjoy most. You can see my Unity work at https://liamswift.com/level-design/ and my jam games at liam-swift.itch.io. My CV is attached.
>
> I'd love to chat about the project. Wishing you all the best!
>
> Liam Dobbelaere
> liam.dobbelaere@outlook.com
> +32 471 43 76 55

### Maracas Studio — optional, only for volume (they say NO cover letter needed)
Email: **hello@maracas-studio.com** · CV: `cv_generic_dev.html` · Be explicit you're a professional, not an intern.

- Subject: `Spontaneous application — gameplay/generalist developer (Liam Dobbelaere)`
- Body: "Hi Maracas team, a spontaneous application as a professional developer (not an internship). I'm a gameplay-focused developer with 7 years of C#/software experience and a level design background, based in Bruges and open to remote. Fish Stick Protocol's co-op extraction loop is the kind of systems-heavy multiplayer I'd enjoy building. CV attached, portfolio at https://liamswift.com/level-design/. Happy to be kept in mind if something opens up."

### Oisoi Studio — optional, low priority
Email: **wim@oisoi.studio** · CV: `cv_generic_dev.html` · Confirm their engine (Unity vs Unreal) first; be upfront about no VR experience, pitch as tools/gameplay developer for creative software.

---

## Skip (assessed, not worth the effort)
- **Fire Falcom** — C++ porting shop, no design roles.
- **Altereyes** — posting cancelled, VR-only, on-site Hasselt.
- **Neopica** — producer role (wrong discipline) + expired. WATCH for a UE5 design/gameplay role in Ghent.

## Higher-leverage than more cold apps
1. Make the per-level portfolio clips (Andreas's feedback) — lifts every application.
2. Target gameplay/technical roles at UE/Unity studios (your software strength = real advantage).
3. Warm intros (Steven, Belgian scene, studio Discords) beat cold open-apps.

---

## Remote / international leads (verified Jul 2026 — re-verify before applying)

- **Devoted Studios** — Level/Gameplay Designer, worldwide remote (EU ok), UE5+Blueprint, no C++/VR. Closest real LD fit; gate is 3+ yrs LD + shipped title. Apply via their Workable page. CV: `cv_generic`.
- **Climax Studios** — Experienced Level Designer, UK/EU fully remote, UE4/5+Blueprint. Apply speculatively via https://www.climaxstudios.com/join-our-team/jobs/ (confirm LD seat is open). CV: `cv_generic`.
- **Pine Creek Games** — Unity Programmer, fully remote **CET ±2**, Unity/C#, no C++. Best timezone/technical fit but ~2-yr consultant (freelance-ish). CV: `cv_generic_dev`.
- **Escape Velocity Entertainment** — rolling fully-remote, EU-eligible design roles (Lead LD open now = too senior). Monitor for a non-lead seat.
- **Unknown Worlds** (Subnautica) — UE5/Blueprint LD, EU-hours friendly, listing expired — watch careers page.
- Skip: CM Games (VR), EA DICE Stockholm (on-site), most others (expired / US-only / C++).

## Boards to check weekly (make it a habit, not a scramble)
1. **Amir Satvat / ASGC** — asgc.gg + amirsatvat.com — broadest listings + free mentorship/Discord. Start here.
2. **Work With Indies** — workwithindies.com/categories/design — indie/junior-friendly, remote/TZ tags, portfolio reviews.
3. **RemoteGameJobs** — remotegamejobs.com — remote-only, timezone ranges per listing.
4. **Hitmarker** — hitmarker.net/remote-gaming-jobs — volume + saved remote/LD alerts.
5. **InGameJob** — ingamejob.com — EU-timezone-native, has a Level Design category.
6. **gamejobs.co** — browse manually (blocks bots); surfaced the Climax + Escape Velocity LD roles.

Widen saved alerts to include **"Technical Designer"** and **"Technical Level Designer"** — likely his faster remote door than pure "Level Designer".
