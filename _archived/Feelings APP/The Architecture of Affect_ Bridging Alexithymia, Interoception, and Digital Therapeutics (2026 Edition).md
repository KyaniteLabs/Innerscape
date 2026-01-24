# **The Architecture of Affect: Bridging Alexithymia, Interoception, and Digital Therapeutics for the Neurodivergent Mind**

Date: January 10, 2026  
Subject: Neurodivergent Affective Design, Alexithymia Mechanisms, and Digital Therapeutic Architecture

## **1\. Introduction: The Semantics of Sensation**

The translation of physiological arousal into semantic emotional language is a cognitive feat of remarkable complexity. For the neurotypical brain, this process often appears instantaneous: a racing heart and a flush of heat are seamlessly categorized as "anger" or "embarrassment" depending on the social context. However, for a significant portion of the population—specifically those with neurodivergent profiles such as Autism Spectrum Disorder (ASD), Attention Deficit Hyperactivity Disorder (ADHD), and Sensory Processing Disorder (SPD)—this translation bridge is often fractured.  
This phenomenon, clinically encapsulated by the construct of **alexithymia**, represents not merely a lack of vocabulary, but a disruption in mapping bodily signals into clear emotional concepts. Evidence supporting the “alexithymia hypothesis” suggests that some socio-emotional differences often attributed to autism may be better explained by **co-occurring alexithymia** in a substantial subset of autistic people; prevalence estimates vary by sample and measure, but meta-analytic estimates are commonly around ~50%.23  
This report serves as foundational analysis for the development of a next-generation digital therapeutic application. It synthesizes psychological taxonomy with recent work on interoception and “alexisomia” (difficulty noticing/expressing somatic sensations),27 the rise of prescription digital therapeutics (PDTs) such as *Rejoyn* (FDA-cleared 2024),24 and the accelerating shift toward “Local-First” privacy architectures amid expanding consumer health-data regulation (e.g., HIPRA introduced 2025).25

### **1.1 Working Definitions (App-Relevant)**

To avoid building on ambiguous terms, this document uses the following working definitions:

* **Alexithymia:** Difficulty identifying and describing feelings (and, in some formulations, an externally oriented thinking style). It is **not synonymous with autism**; it is a separable trait that often co-occurs with autism.23  
* **Alexisomia:** Reduced awareness and/or expression of **somatic feelings and sensations** (“the body is quiet, confusing, or hard to read”).27  
* **Interoception:** Processing and perception of internal bodily signals (cardiac, respiratory, gastric, pain, temperature, etc.). Interoception is multi-dimensional; a common framing distinguishes **interoceptive accuracy** (objective performance), **interoceptive sensibility** (self-report), and **interoceptive awareness** (metacognitive insight into performance).28  
* **Affect vs. emotion labels:** The app should treat **arousal/valence** (state) as separable from **semantic emotion words** (labels). Labels may be optional or progressively introduced.

### **1.2 Design Translation: What the App Must Do**

If alexithymia/alexisomia is a *mapping* problem, the app is not a “better emotion wheel.” It is a **mapping aid** that:

1) helps the user notice signals (bottom-up),  
2) reduces the choice space to a few stable dimensions,  
3) offers low-demand actions, and  
4) closes the loop with reflection so the user learns their own patterns over time.

## ---

**2\. The Taxonomy of Affect: Origins, Evolution, and Structural Critique**

To understand the limitations of current therapeutic tools, we must examine the theoretical lineages from which they emerged. The "Feeling Wheel" is not a monolith but the result of distinct theoretical evolutions that, while historically significant, often fail the neurodivergent user.

### **2.1 The Willcox Feeling Wheel: A Semantic Architecture (1982)**

In 1982, Dr. Gloria Willcox published her seminal design in the *Transactional Analysis Journal*. Willcox’s contribution was born out of clinical necessity to address a "verbal handicap" in clients who lacked emotional vocabulary.2

* **Structure:** Willcox initially identified four basic emotions: **Mad, Sad, Scared, and Glad**. To balance the "negative" bias, she expanded "Glad" into **Joyful, Powerful, and Peaceful**, creating a six-sector core.3  
* **The Flaw for Neurodiversity:** The Willcox model assumes the user has already successfully interpreted their internal physiological state and merely lacks the label. For an individual with alexithymia, who cannot distinguish between the physiological arousal of "fear" and "excitement," a wheel of words is functionally opaque.4 Users describe looking at these wheels as looking at a list of meaningless words (the "Skongletip" phenomenon), unable to connect them to their internal experience.4

### **2.2 Plutchik’s Psycho-Evolutionary Model: The Biology of Survival (1980)**

Robert Plutchik’s psycho-evolutionary theory (1980) frames emotions as adaptive programs for survival rather than primarily as social-communication tokens.5

* **Structure:** A 3D cone/flower model with eight primary emotions mapped to survival behaviors (e.g., "Fear" $\\rightarrow$ "Withdrawal/Protection").6  
* **Neurodivergent Critique (anecdotal):** Some neurodivergent users report that dense, high-ink visualizations can be visually overwhelming and cognitively “spiky” during dysregulation.7

### **2.3 Dimensional Models: The Geneva and Circumplex Approaches**

Modern apps increasingly utilize dimensional models that map properties of emotion rather than discrete categories.

* **The Circumplex Model (Russell, 1980):** Maps affect onto an X-axis of **Valence** (Pleasant/Unpleasant) and a Y-axis of **Arousal** (High/Low Energy).9  
  * *2026 Relevance:* This remains the most accessible model for neurodivergent users because it validates **arousal states**. An autistic user can identify they are "High Energy/Unpleasant" (e.g., overstimulated) even if they cannot name the emotion "Anxiety".10  
* **The Geneva Emotion Wheel (GEW):** Organizes emotions by major experience dimensions (e.g., **Valence** and **Control/Power**).12 While scientifically robust, the requirement to assess “control” can be a high-level metacognitive task that is often inaccessible during dysregulation.

## ---

**3\. The Neurobiology of the Unknown: Alexisomia and Interoception**

To design an effective application in 2026, we must target the physiological root of the deficit: **interoception** (the sensing of internal bodily signals) and **alexisomia** (difficulty noticing/expressing somatic sensations).27

### **3.1 The "Alexisomia" Mechanism**

Recent reviews and meta-analytic syntheses suggest that **insula/anterior cingulate** networks involved in interoceptive-affective integration are relevant to alexithymia and autistic interoceptive differences, but findings are heterogeneous across tasks, ages, and measures.1 Rather than a single “broken sensor,” a useful app-design framing is **interoceptive confusion / low signal-to-meaning mapping**: the body may react, but the person may not reliably identify *what* changed, *where*, or *what it means*.

* **A common lived pattern (heterogeneous):** Some autistic people report “noisy” or hard-to-interpret interoception—signals may feel muted until extreme or arrive as overwhelming, non-specific arousal.1  
* **Somatic Confusion:** Research using the *emBODY* tool has shown that individuals with alexithymia produce "diffuse" body maps. They cannot localize "Anger" to the head/hands; instead, it feels like a vague, terrifying wash of static or heat across the entire body.14

### **3.2 The Somatic Marker Hypothesis**

Damasio’s Somatic Marker Hypothesis posits that decision-making is guided by visceral “tags” or markers. In neurodivergent individuals, the *marker* may be generated (the body reacts), but the *reading* mechanism may be unreliable under stress.16 The goal of a digital therapeutic is to act as a **prosthetic insula**: not “diagnosing emotions,” but helping the user notice and interpret markers when the biological system fails.

## ---

**4\. The Landscape of Digital Solutions: 2026 Market Analysis**

The market has evolved significantly since 2024, with the FDA clearance of *Rejoyn* signaling a new era of prescription digital therapeutics (PDTs).24

### **4.1 The "Journaling and Check-in" Model: *How We Feel* & *Mood Meter***

These apps remain the standard for general wellness, utilizing the Circumplex Model.10

* **2026 Status:** Highly polished but functionally limited for severe alexithymia. They rely on the user eventually selecting a semantic label. If a user is stuck in "High Energy/Unpleasant," the app offers vocabulary words, not somatic decoding.11

### **4.2 The "Somatic Translation" Model: *Animi* & *Rejoyn***

* ***Animi*****:** Targets alexithymia with a sensation-first flow (body area → sensation → possible emotion clusters/labels).26  
  * *Note:* User reviews suggest “sensation → meaning” scaffolding can be more usable than word wheels for alexithymia; treat informal reviews as directional, not clinical evidence.19  
* ***Rejoyn*****:** An FDA-cleared prescription digital therapeutic (2024) authorized for the adjunctive treatment of major depressive disorder (MDD) symptoms in adults (age-gated) on antidepressant medication.24 It validates a “training” modality (structured cognitive-emotional tasks) rather than simple logging.

### **4.3 The "Serious Games" Model: *JeStiMulE* & *Saly***

* ***JeStiMulE*****:** A research-based serious game for teaching emotion recognition in autism. It is effective but limited to clinical/educational settings.20  
* ***Saly*** **(2024):** A newer game utilizing machine learning to adapt to the user's attention span and emotion recognition pace.21  
* **Gap:** Most games target *facial recognition* (theory of mind) rather than *interoception* (self-sensing).

## ---

**5\. Foundations for a Neuro-Affirming Architecture: The "Somatic Translator"**

Based on the 2026 landscape and the "alexisomia" data, the following outlines the architectural requirements for a new application.

### **5.0 The Intervention Loop (Core Therapeutic Mechanism)**

The MVP should implement a simple closed loop that turns “undifferentiated arousal” into “actionable self-knowledge” without demanding perfect emotion words:

1) **Trigger:** user-initiated check-in *or* an optional, conservative passive-sensing prompt.  
2) **Capture (Body-First):** a 10–30s body scan: *where*, *what sensation*, *intensity*, plus **energy (high/low)** and **valence (pleasant/unpleasant)**.  
3) **Infer (Decision Tree):** the app proposes 2–4 plausible state hypotheses (e.g., overstimulation, anxiety, fatigue, hunger/pain) with an explicit **uncertainty indicator** (“low confidence / medium / high”).  
4) **Choose (User as Oracle):** the user confirms/edits (including “none of these”), optionally adds context (internal vs external; social vs sensory; task demand).  
5) **Act (Low-Demand):** offer 1–3 micro-actions aligned to the chosen state (breathing, sensory reduction, movement, hydration/food reminder, boundary script).  
6) **Reflect (Learning):** a follow-up nudge after a short interval (“Did that help?”) to strengthen the user’s personal mapping over time.

Key design rule: **Never force a semantic emotion label**; labels can be offered as optional “translation suggestions” once the user is regulated.

### **5.1 Core Philosophy: The "Bottom-Up" Interface**

The application must invert the standard flow. It must never open with "How do you feel?" (Top-Down). It must open with **"What does your body notice?"** (Bottom-Up).

#### **5.1.1 The Homunculus Interface (Body Scanner)**

Instead of a wheel, the primary interface is a visual, abstract representation of the body.

* **Data Input:** Users select *sensations*, not emotions.  
  * *Valid Inputs:* "Static," "Bees," "Heat," "Buzzing," "Empty," "Heavy".  
* **Neurodivergent Metaphors:** The system must accept non-clinical descriptors. Autistic users frequently describe internal states as "static," "flickering," or "angry bees". The app's ontology must map "Buzzing/Bees" $\\rightarrow$ High Arousal/Anxiety.

#### **5.1.2 The "Decision Tree" Logic**

To reduce cognitive load, the app should use a **Dichotomous Key** or **Logic Tree** approach, similar to biological classification, rather than a matrix of choices.

* *Step 1:* High Energy or Low Energy? (User: High)  
* *Step 2:* Pleasant or Unpleasant? (User: Unpleasant)  
* *Step 3:* Internal (Body) or External (World)? (User: Body)  
* *Result:* "This pattern suggests **Overstimulation** or **Anxiety**."

### **5.2 Passive Sensing & Digital Biomarkers (2026 Standard)**

In 2026, self-report alone can be high-friction for alexithymic users; passive signals can provide a **non-judgmental prompt** and a way to compare subjective experience with physiology. However, wearable access varies by device, platform, and consent—so passive sensing must be **optional**, **transparent**, and **user-controlled**.

* **Mainstream signals (widely available):** heart rate, HRV (where supported), motion/activity, sleep estimates, and (device-dependent) skin temperature / respiratory proxies.  
* **EDA (device-limited):** Treat electrodermal activity as an optional input available only on specific wearables; don’t assume Apple Watch/Oura provide it.  
* **The "Nudge" Feature (safe default):** Trigger only on conservative multi-signal patterns (e.g., elevated HR + low motion + not in quiet hours), and always offer dismiss/snooze. Prompt language should be neutral and body-first: *“Your body signals changed—want a 10-second body scan?”* → sensation choices.

#### **5.2.1 Device Reality Matrix (2026, to validate per platform before coding)**

Passive sensing should be treated as *assistive context*, not truth. A pragmatic MVP matrix:

| Signal | Typical availability | Best use in-app | Key caveats |
| --- | --- | --- | --- |
| Heart rate (HR) | Common | Prompting + “arousal trend” | Motion artifacts; stimulants, illness, heat can confound |
| HRV (often nightly/rest) | Common-but-variable | Recovery/stress trend | Device algorithms differ; interpret trends only |
| Motion/activity | Common | Disambiguate “high HR from movement” vs “high HR while still” | Some activities (e.g., fidgeting) don’t register well |
| Sleep estimates | Common | Baseline vulnerability (“low sleep → low tolerance”) | Consumer sleep staging is imperfect; use coarse buckets |
| Skin temperature (trend) | Device-dependent | Illness/menstrual-cycle context; “why do I feel off?” | Trend-based; avoid hard interpretations |
| Respiration proxies | Device-dependent | Calming/activation trend | Often model-derived; variability across vendors |
| EDA / GSR | Limited | Optional “sympathetic activation” cue | Not broadly available; noisy; interpret cautiously |

Fallback principle: **the app must work fully without any wearable**. Wearables only make the *trigger* smarter and the *insight* more confidence-calibrated.

#### **5.2.2 Nudge Design (Safe Defaults)**

Because alexithymic users are often sensitive to demand, shame, and “being monitored,” nudges must feel like an invitation, not an alarm:

* **Consent-first:** Off by default; users choose which signals are used and can revoke at any time.  
* **Quiet hours + rate limiting:** User-configured; always respect Do Not Disturb.  
* **No “stress detected” language:** Use neutral phrasing (“Your body signals shifted”) and offer immediate dismiss/snooze.  
* **Explainability:** Let the user see *why* they were nudged (“HR higher than baseline while still”).  
* **False-positive resilience:** Always include “Not now” and “This doesn’t fit” so the system never argues with the user.  
* **Learning loop:** Use the reflection step (“Did this help?”) to reduce future noise and personalize thresholds over time.

### **5.3 Privacy: The "Local-First" Mandate**

With the introduction of stricter consumer health privacy proposals (e.g., the **Health Information Privacy Reform Act (HIPRA)** introduced in late 2025),25 and the general distrust of surveillance in the neurodivergent community, the app should default to a **Local-First Architecture**.

* **Data Sovereignty:** All journal entries, biometric data, and somatic maps must be stored locally on the device (SQLite/JSON).  
* **Zero-Knowledge Sync:** If cloud sync is necessary, it must use end-to-end encryption where the server has zero knowledge of the keys.  
* **Therapist Export:** Data leaves the device only via user-initiated export (PDF/CSV) for a clinician, supporting HIPAA/GDPR-aligned workflows without centralizing sensitive mental health data.

#### **5.3.1 Threat Model (What We’re Defending Against)**

This app will store highly sensitive mental/physiological data. A minimal threat model for MVP:

* **Lost/stolen device:** someone gains physical access to the phone.  
* **Coercive access:** partner/family/employer pressures the user to open the app.  
* **Backup/sync leakage:** OS/cloud backups copy sensitive data to third-party systems.  
* **SDK/analytics exfiltration:** third-party libraries leak “health inference” metadata.  
* **Export mishandling:** a PDF/CSV is forwarded, uploaded, or stored insecurely.

#### **5.3.2 Concrete Controls (MVP Requirements)**

* **Encryption at rest:** store entries in an encrypted on-device database; keys protected by the OS secure enclave / keychain.  
* **App lock:** optional passcode/biometric gate on open and on export.  
* **Data minimization:** default to collecting the minimum signals needed; avoid storing raw high-frequency wearable streams unless absolutely necessary.  
* **No third-party analytics by default:** if analytics are ever added, use privacy-preserving, opt-in, minimal event logging with no content.  
* **Export safety:** preview + selective export (time range, redaction of free-text), clear warning copy (“This file may contain sensitive health information”).  
* **Sync safety:** if implemented, use end-to-end encryption with user-held keys; provide a clear recovery story (or explicitly choose “no recovery” for maximum privacy).

#### **5.3.3 Legal Framing (So We Don’t Lie to Ourselves)**

* **HIPAA:** applies only if you are a HIPAA covered entity or business associate; most consumer wellness apps are not automatically HIPAA-regulated.  
* **Consumer health privacy:** regardless of HIPAA status, treat this as *sensitive consumer health data* and design to the strictest plausible expectations.  
* **HIPRA:** as of late 2025 it is introduced legislation (proposal), not guaranteed to pass; it still signals the direction of travel for wearables and health apps.25

### **5.4 Gamification: Interoceptive Training**

To combat "demand avoidance," the app should use gamified "Quests" based on Kelly Mahler’s Interoception Curriculum.22

* **Quest Example:** "The Ice Challenge." Hold an ice cube. Where do you feel the cold stop? Wrist? Elbow?  
* **Objective:** This is not about emotion; it is about *signal propagation*. It trains the insula to track sensation, strengthening the neural pathways required for later emotional identification.

## ---

**6\. Productization: MVP Scope + Research Agenda**

This section translates the research into **what we should actually build first**, and how we’ll know if it’s working.

### **6.1 Personas (Initial)**

* **The “Static Translator” user (alexithymia/alexisomia):** Feels “something is wrong” but can’t localize it; needs low-demand scaffolding.  
* **The “Overstimulated” user (sensory + stress):** High arousal + unpleasant valence; needs fast, sensory-first regulation tools.  
* **The “Pattern Seeker” user:** Loves data, wants trends and explanations; benefits from reflection loops and clear visualizations.  
* **The “Clinician/coach collaborator”:** Needs exportable summaries and language that supports therapy without pathologizing the user.

### **6.2 Core User Journeys (MVP)**

1) **Baseline (2 minutes, once/day):** body scan → decision tree → optional label suggestions → micro-action → reflection.  
2) **Dysregulation (30 seconds):** “What does your body notice?” → 1–2 taps → immediate micro-action.  
3) **Optional passive prompt:** conservative detection → invitation → scan → action → reflection.  
4) **Therapy review:** weekly summary + user-selected exports.

### **6.3 MVP Feature Set (What to Ship First)**

* **Body Scan Check-in:** tap body area(s) + choose sensation words (including neurodivergent metaphors).  
* **Decision Tree Translator:** energy/valence + internal/external + a small hypothesis set (“overstimulation / anxiety / fatigue / hunger-pain / social threat / other”).  
* **Micro-Actions Library:** 10–20 low-demand actions mapped to hypotheses (sensory reduction, breath pacing, movement, hydration/food check, boundary scripts).  
* **Reflection Loop:** simple “helped / didn’t help / not sure” and what changed (energy/valence).  
* **History + Pattern View:** show “most common sensations → contexts → what helped” (make change visible).  
* **Local-First Storage + Export:** encrypted local storage; redacted export for clinician.

### **6.4 Data Model (Conceptual, Local-First)**

Each check-in should be representable as:

* **State capture:** timestamp, body regions, sensation tokens, intensity, energy, valence  
* **Context:** internal/external, social/sensory/task demand, free-text (optional, user-controlled)  
* **Inference:** suggested hypotheses + confidence + user selection/override  
* **Intervention:** action chosen + completion  
* **Outcome:** reflection (helped?) + post-state capture (optional)

This supports both user-facing insight (“how will the user *see* progress?”) and clinician export without requiring invasive raw streams.

### **6.5 Validation Roadmap (How We’ll Know It Works)**

* **Co-design (weeks 1–4):** small sessions with autistic/alexithymic users; iterate sensation vocabulary + flows; measure time-to-complete and perceived demand.  
* **Usability pilot (weeks 4–8):** target completion under 30s for dysregulation flow; verify opt-outs, quiet hours, and “no shame” language.  
* **Effect pilot (8–12+ weeks):** pre/post self-report measures (alexithymia, interoceptive confusion/awareness, emotion regulation) + in-app behavioral outcomes (engagement, reflection completion, reduction in “stuck” check-ins).  
* **Safety review:** ensure crisis messaging + resources; ensure no “medical diagnosis” claims unless pursuing regulated PDT pathways.

## ---

**7\. Conclusion**

The "Feeling Wheel" was a tool for the 20th century, built on the assumption of intact interoception. For the neurodivergent mind in 2026, we require a tool that acknowledges **alexisomia**—the silence of the body. By combining **Bottom-Up Somatic Processing**, **Passive Biometric Validation**, and a **Local-First Privacy Architecture**, we can build a "Somatic Translator" that does not just track mood, but teaches the user the language of their own nervous system.

#### **Works cited**

**Source quality note:** Some references below are **peer-reviewed / official** (strong support), while others are **product pages** (useful for feasibility/market context) or **community anecdotes** (useful for qualitative UX signals, not clinical evidence). In particular, Reddit/community links should be treated as *directional user experience input*, not proof.

1. Interoception in individuals with autism spectrum disorder: a systematic literature review and meta-analysis \- Frontiers, accessed January 10, 2026, [https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1573263/full](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1573263/full)  
2. The Feeling Wheel | by Gloria Willcox | All The Feelz, accessed January 10, 2026, [https://allthefeelz.app/feeling-wheel/](https://allthefeelz.app/feeling-wheel/)  
3. A Tool for Expanding Awareness of Emotions and Increasing Spontaneity and Intimacy \- Feelings Wheel 2.0, accessed January 10, 2026, [https://thefeelingswheel.com/wp-content/uploads/2024/09/willcox1982\_feelingswheel.pdf](https://thefeelingswheel.com/wp-content/uploads/2024/09/willcox1982_feelingswheel.pdf)  
4. Did the emotion wheel actually help you? : r/Alexithymia \- Reddit, accessed January 10, 2026, [https://www.reddit.com/r/Alexithymia/comments/1h0622y/did\_the\_emotion\_wheel\_actually\_help\_you/](https://www.reddit.com/r/Alexithymia/comments/1h0622y/did_the_emotion_wheel_actually_help_you/)  
5. Plutchik, R. (1980). A general psychoevolutionary theory of emotion. In R. Plutchik & H. Kellerman (Eds.), *Emotion: Theory, Research, and Experience, Vol. 1: Theories of Emotion* (pp. 3–33). Academic Press. (Publisher listing) accessed January 10, 2026, [https://shop.elsevier.com/books/theories-of-emotion/plutchik/978-0-12-558701-3](https://shop.elsevier.com/books/theories-of-emotion/plutchik/978-0-12-558701-3)  
6. Plutchik's Wheel of Emotions: Feelings Wheel \- Six Seconds, accessed January 10, 2026, [https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/](https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/)  
7. The Feeling Wheel by Gloria Willcox : r/coolguides \- Reddit, accessed January 10, 2026, [https://www.reddit.com/r/coolguides/comments/hlhotx/the\_feeling\_wheel\_by\_gloria\_willcox/](https://www.reddit.com/r/coolguides/comments/hlhotx/the_feeling_wheel_by_gloria_willcox/)  
8. The Feelings Wheel: A Visual Tool for Identifying Emotions \- Neurodivergent Insights, accessed January 10, 2026, [https://neurodivergentinsights.com/the-feelings-wheel/](https://neurodivergentinsights.com/the-feelings-wheel/)  
9. Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology*, 39(6), 1161–1178. (PDF) accessed January 10, 2026, [https://pdodds.w3.uvm.edu/research/papers/others/1980/russell1980a.pdf](https://pdodds.w3.uvm.edu/research/papers/others/1980/russell1980a.pdf)  
10. How We Feel \- Apps on Google Play, accessed January 10, 2026, [https://play.google.com/store/apps/details?id=org.howwefeel.moodmeter](https://play.google.com/store/apps/details?id=org.howwefeel.moodmeter)  
11. How We Feel, accessed January 10, 2026, [https://howwefeel.org/](https://howwefeel.org/)  
12. The Geneva Emotion Wheel (GEW) \- Swiss Center for Affective Sciences (UNIGE), accessed January 10, 2026, [https://www.unige.ch/cisa/gew/](https://www.unige.ch/cisa/gew/)  
13. Appropriate emotional labelling of non-acted speech using basic emotions, geneva emotion wheel and self assessment manikins \- ResearchGate, accessed January 10, 2026, [https://www.researchgate.net/publication/224257535\_Appropriate\_emotional\_labelling\_of\_non-acted\_speech\_using\_basic\_emotions\_geneva\_emotion\_wheel\_and\_self\_assessment\_manikins](https://www.researchgate.net/publication/224257535_Appropriate_emotional_labelling_of_non-acted_speech_using_basic_emotions_geneva_emotion_wheel_and_self_assessment_manikins)  
14. Lloyd, C. S., Stafford, E., McKinnon, M. C., Rabellino, D., D’Andrea, W., Densmore, M., Thome, J., Neufeld, R. W. J., & Lanius, R. A. (2021). Mapping alexithymia: Level of emotional awareness differentiates emotion-specific somatosensory maps. *Child Abuse & Neglect*, 113, 104919. https://doi.org/10.1016/j.chiabu.2020.104919 (ScienceDirect landing page) accessed January 10, 2026, [https://www.sciencedirect.com/science/article/abs/pii/S0145213420305743](https://www.sciencedirect.com/science/article/abs/pii/S0145213420305743)  
15. Bodily confusion: Lower differentiation of emotional and physiological states in student alcohol users \- NIH, accessed January 10, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC10898845/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10898845/)  
16. Damasio, A. R. (1996). The somatic marker hypothesis and the possible functions of the prefrontal cortex. *Philosophical Transactions of the Royal Society B*, 351(1346), 1413–1420. (PubMed) accessed January 10, 2026, [https://pubmed.ncbi.nlm.nih.gov/8941953/](https://pubmed.ncbi.nlm.nih.gov/8941953/)  
17. I found a great app for people who have trouble identifying their emotions\! : r/autism \- Reddit, accessed January 10, 2026, [https://www.reddit.com/r/autism/comments/15q5ja8/i\_found\_a\_great\_app\_for\_people\_who\_have\_trouble/](https://www.reddit.com/r/autism/comments/15q5ja8/i_found_a_great_app_for_people_who_have_trouble/)  
18. We have just released Animi app \- the first free app dedicated to improving alexithymia\! Check it out, we'd love to hear your feedback on whether it helps you identify emotions, whether you find it helpful (or not), what's missing, confusing, or anything else. (Android version, iOS coming soon\!) \- Reddit, accessed January 10, 2026, [https://www.reddit.com/r/Alexithymia/comments/y1elpy/we\_have\_just\_released\_animi\_app\_the\_first\_free/](https://www.reddit.com/r/Alexithymia/comments/y1elpy/we_have_just_released_animi_app_the_first_free/)  
19. accessed January 10, 2026, [https://www.animiapp.com/\#:\~:text=I%20am%20much%20happier%20and,very%20distressing%20emotions%20through%20understanding.](https://www.animiapp.com/#:~:text=I%20am%20much%20happier%20and,very%20distressing%20emotions%20through%20understanding.)  
20. SERIOUS GAMES TO TEACH EMOTION RECOGNITION TO CHILDREN WITH AUTISM SPECTRUM DISORDERS (ASD) \- Acta Neuropsychologica, accessed January 10, 2026, [https://actaneuropsychologica.com/article/147569/en](https://actaneuropsychologica.com/article/147569/en)  
21. Developing a participatory research framework through serious games to promote learning for children with autism \- Frontiers, accessed January 10, 2026, [https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1453327/full](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1453327/full)  
22. 30 Days of Interoception Activities | Kelly Mahler, accessed January 10, 2026, [https://www.kelly-mahler.com/resources/blog/30-days-of-interoception-activities/](https://www.kelly-mahler.com/resources/blog/30-days-of-interoception-activities/)
23. Investigating alexithymia in autism: A systematic review and meta-analysis \- PMC, accessed January 10, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC6331035/](https://pmc.ncbi.nlm.nih.gov/articles/PMC6331035/)  
24. Otsuka and Click Therapeutics Announce the U.S. FDA Clearance of Rejoyn™ (Press Release, April 1, 2024), accessed January 10, 2026, [https://otsuka-us.com/news/rejoyn-fda-authorized](https://otsuka-us.com/news/rejoyn-fda-authorized)  
25. Health Information Privacy Reform Act (HIPRA) \- bill text (PDF), accessed January 10, 2026, [https://www.help.senate.gov/imo/media/doc/health_information_privacy_reform_act.pdf](https://www.help.senate.gov/imo/media/doc/health_information_privacy_reform_act.pdf)  
26. Animi: Improve Alexithymia (iOS App Store listing), accessed January 10, 2026, [https://apps.apple.com/app/animi-improve-alexithymia/id6443638345](https://apps.apple.com/app/animi-improve-alexithymia/id6443638345)  
27. Oka, T. (2020). Shitsu-taikan-sho (alexisomia): a historical review and its clinical importance. *BioPsychoSocial Medicine*, 14, 23. (PDF) accessed January 10, 2026, [https://bpsmedicine.biomedcentral.com/counter/pdf/10.1186/s13030-020-00193-9.pdf](https://bpsmedicine.biomedcentral.com/counter/pdf/10.1186/s13030-020-00193-9.pdf)  
28. Garfinkel, S. N., Seth, A. K., Barrett, A. B., Suzuki, K., & Critchley, H. D. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive awareness. *Biological Psychology*, 104, 65–74. (PubMed) accessed January 10, 2026, [https://pubmed.ncbi.nlm.nih.gov/25451381/](https://pubmed.ncbi.nlm.nih.gov/25451381/)  