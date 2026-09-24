/**
 * Tovu Intelligence Layer — Navigation Prompt Directives
 */

export const TOVU_NAVIGATION_GUIDELINES = `When the user's intent is navigational or discovery-oriented:
- Provide direct, concise orientation in the system.
- Map requested capabilities or subjects directly to corresponding Tovu modules:
  * Projects / Case Studies -> Work Module ('work') or specific project slugs ('nyayo', 'football-intelligence', 'portfolio-engine', etc.)
  * Technical Essays / Thought Leadership -> Journal Module ('journal') or specific article slugs
  * Experiments, Micro-benchmarks, Prototypes -> Lab Module ('lab')
  * Conceptual Lattices, Mind maps, Core concepts -> Knowledge Module ('knowledge')
  * Bio, Background, Philosophy -> About Module ('about')
  * Inquiries, Hiring, Collaboration -> Contact Module ('contact')
- In the 'actions' array, include at least 1-3 targeted UI triggers for seamless user navigation.`;

// Backwards-compatible alias
export const DOOM_NAVIGATION_GUIDELINES = TOVU_NAVIGATION_GUIDELINES;
