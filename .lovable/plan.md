

## AI-Powered Instructional Design Engine - Feasibility Analysis and Implementation Plan

### Context and Stakeholder

The primary user is a **Training Manager** responsible for building the entire instructional design of an organization spanning from security guards (custodios) to administrative staff. She needs to create dozens of courses across multiple categories with limited time and instructional design expertise. The AI must act as her **co-designer**, not just a content generator.

### Current State Assessment

The wizard already has AI integration via `lms-ai-assistant` edge function with 6 actions:

| Capability | Status | Gap |
|---|---|---|
| Metadata generation (code, description, category) | Working | Minimal |
| Course structure generation (modules + contents) | Working | No learning objectives, no assessment strategy |
| Quiz question generation | Working but **deferred** | Cannot create questions inline in wizard; placeholder says "after course creation" |
| Flashcard generation | Working but **deferred** | Same deferral issue |
| Rich text content generation | Working inline | Basic prompt, no instructional context |
| Cover image generation | Working | OK |
| Video script/prompt generation | **Missing** | No way to help create video content |
| Learning objectives | **Missing** | No objectives per module or course |
| Assessment strategy | **Missing** | No config for passing scores, retries, weighting |
| Competency mapping | **Missing** | No link between courses and competencies |
| Full course generation from a single prompt | **Missing** | User must go step by step |

### Proposed Enhancements (Prioritized by Impact)

---

#### Phase 1: Inline Quiz Editor with AI (HIGH IMPACT)

**Problem**: The quiz content type shows a placeholder "Editor completo disponible despues" - the training manager cannot build quizzes during course creation.

**Solution**: Embed a full quiz editor directly in the `ContentEditor` and `QuickContentCreator` components for `quiz` type content. AI generates questions based on the module context.

**Changes**:
- New component `src/components/lms/admin/wizard/InlineQuizEditor.tsx`
  - Renders generated questions with edit capability
  - Each question shows: question text, options (with correct/incorrect toggles), explanation
  - "Generate with AI" button that uses module title + course title as context
  - Add/remove/reorder questions manually
  - Store questions in `ContentOutline.contenido.preguntas` array
- Modify `ContentEditor.tsx`: Replace quiz placeholder (lines 200-211) with `InlineQuizEditor`
- Modify `QuickContentCreator.tsx`: Replace quiz placeholder (lines 271-282) with `InlineQuizEditor`
- Modify `StepEstructura.tsx`: Update `ContentOutline` type to include `preguntas` in contenido

**Feasibility**: HIGH - AI quiz generation already works in the backend. Only UI integration is missing.

---

#### Phase 2: Learning Objectives Generator (HIGH IMPACT)

**Problem**: No learning objectives defined anywhere. A training manager needs clear objectives per module to validate instructional alignment.

**Solution**: Add a learning objectives field to each module, with AI auto-generation.

**Changes**:
- Modify `StepEstructura.tsx`: Add `objetivos` field to `ModuleOutline` type
- Modify `ModuleOutlineCard.tsx`: Add an expandable "Objectives" section below the module title
  - Shows 3-5 bullet point objectives
  - "Generate with AI" button that creates objectives based on module title and contents
- Add new action `generate_learning_objectives` to `lms-ai-assistant/index.ts`
  - Input: module title, course title, content titles
  - Output: array of objective strings using Bloom's taxonomy verbs
- Modify `useLMSAI.ts`: Add `generateLearningObjectives` function

**Feasibility**: HIGH - Simple text generation, same pattern as existing actions.

---

#### Phase 3: AI Video Script and Prompt Generator (MEDIUM IMPACT)

**Problem**: Videos are the most common content type but the platform cannot create them. The training manager needs guidance on what the video should contain.

**Solution**: When adding a video content item, offer an AI-generated **video script** and a **prompt for external video tools** (like Synthesia, HeyGen, or Runway).

**Changes**:
- New component `src/components/lms/admin/wizard/VideoScriptGenerator.tsx`
  - Generates a structured video script: intro, key points, examples, conclusion
  - Generates a ready-to-paste prompt for AI video tools (Synthesia, HeyGen, etc.)
  - Shows estimated duration based on word count
  - Copy-to-clipboard buttons for both outputs
- Modify `ContentEditor.tsx`: Add "Generate Script" button next to video URL input
- Modify `QuickContentCreator.tsx`: Same addition for video type
- Add new action `generate_video_script` to `lms-ai-assistant/index.ts`
  - Input: topic, module context, target duration, target audience (role)
  - Output: `{ script: string, externalPrompt: string, estimatedDuration: number }`
- Modify `useLMSAI.ts`: Add `generateVideoScript` function

**Feasibility**: HIGH for script generation. Video creation itself requires external tools, but providing the script and prompt is fully feasible.

---

#### Phase 4: One-Click Full Course Generation (HIGH IMPACT)

**Problem**: The training manager must navigate 4 wizard steps to create a course. For someone building 20+ courses, this is slow.

**Solution**: Add a "Generate Full Course" mode at the beginning of the wizard that creates everything from a single descriptive prompt.

**Changes**:
- New component `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx`
  - A prominent card at the top of Step 1 (Identidad)
  - Input: course topic (text), target role (select), estimated duration (slider)
  - On click: chains multiple AI calls sequentially:
    1. `generate_course_metadata` -> fills code, description, category, level
    2. `generate_course_structure` -> fills modules with contents
    3. For each text content: `generate_rich_text`
    4. For each quiz content: `generate_quiz_questions`
    5. `generate_image` -> generates cover
  - Shows progress indicator ("Generating metadata... Generating structure... Generating content 1/5...")
  - After completion, user can review and edit everything in the normal wizard flow
- Modify `StepIdentidad.tsx`: Add `AIFullCourseGenerator` above the manual form
- Add new action `generate_full_course` to `lms-ai-assistant/index.ts` that handles the orchestration in a single call (more efficient than multiple round trips)
- Modify `useLMSAI.ts`: Add `generateFullCourse` function

**Feasibility**: HIGH - All individual pieces exist. The orchestration is new but straightforward. Timeout may need to be extended to 60s for the edge function.

---

#### Phase 5: Assessment Strategy Configuration (MEDIUM IMPACT)

**Problem**: No way to configure passing scores, retry limits, or question randomization during course creation. Currently hardcoded to 80% (`QUIZ_MIN_SCORE`).

**Solution**: Add assessment configuration to Step 3 (Configuracion).

**Changes**:
- Modify `StepConfiguracion.tsx`: Add new "Assessment" section with:
  - Passing score slider (60-100%, default 80%)
  - Max retry attempts (1-unlimited)
  - Question randomization toggle
  - Time limit per quiz toggle + minutes input
  - AI recommendation button: suggests settings based on course level and category
- Modify wizard schema in `LMSCursoWizard.tsx`: Add assessment fields to `cursoSchema`
- Store in course metadata (requires DB column or JSON field)

**Feasibility**: MEDIUM - UI is straightforward, but requires schema changes in the database to store these settings per course.

---

#### Phase 6: Inline Flashcard Editor (MEDIUM IMPACT)

**Problem**: Same deferral issue as quizzes - flashcards show "Configuracion avanzada disponible despues".

**Solution**: Embed flashcard editor in the `interactivo` content type.

**Changes**:
- New component `src/components/lms/admin/wizard/InlineFlashcardEditor.tsx`
  - Grid of front/back card pairs
  - "Generate with AI" fills cards from module context
  - Manual add/edit/delete/reorder
- Modify `ContentEditor.tsx`: Replace interactivo placeholder (lines 213-224) with `InlineFlashcardEditor`
- Modify `QuickContentCreator.tsx`: Replace interactivo placeholder (lines 284-295)

**Feasibility**: HIGH - Backend already supports flashcard generation.

---

### Implementation Order and Effort

| Phase | Feature | Files to Create | Files to Modify | Effort | Priority |
|---|---|---|---|---|---|
| 1 | Inline Quiz Editor | 1 | 3 | Medium | P0 |
| 2 | Learning Objectives | 0 | 4 | Small | P0 |
| 3 | Video Script Generator | 1 | 4 | Medium | P1 |
| 4 | Full Course Generation | 1 | 3 | Large | P1 |
| 5 | Assessment Config | 0 | 3 | Medium | P2 |
| 6 | Inline Flashcard Editor | 1 | 3 | Medium | P2 |

### Technical Notes

- All AI calls use the existing `lms-ai-assistant` edge function with `LOVABLE_API_KEY` (already configured)
- Current model: `google/gemini-2.5-flash` for text, `google/gemini-2.5-flash-image-preview` for images
- For Phase 4 (full course), consider upgrading to `google/gemini-3-flash-preview` for better structured output
- Current timeout is 25s per call; Phase 4 may need 60s or sequential calls with progress
- No external API keys needed; everything runs through Lovable AI Gateway

### Files Summary

**New files (4)**:
- `src/components/lms/admin/wizard/InlineQuizEditor.tsx`
- `src/components/lms/admin/wizard/VideoScriptGenerator.tsx`
- `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx`
- `src/components/lms/admin/wizard/InlineFlashcardEditor.tsx`

**Modified files (6)**:
- `supabase/functions/lms-ai-assistant/index.ts` (new actions: learning objectives, video script, full course)
- `src/hooks/lms/useLMSAI.ts` (new functions for each action)
- `src/components/lms/admin/wizard/ContentEditor.tsx` (replace quiz/interactivo placeholders)
- `src/components/lms/admin/wizard/QuickContentCreator.tsx` (replace quiz/interactivo placeholders)
- `src/components/lms/admin/wizard/ModuleOutlineCard.tsx` (learning objectives section)
- `src/components/lms/admin/wizard/StepEstructura.tsx` (updated types)
- `src/components/lms/admin/wizard/StepIdentidad.tsx` (full course generator)
- `src/components/lms/admin/wizard/StepConfiguracion.tsx` (assessment config)

### Recommended Approach

Given the scope, I recommend implementing **Phases 1-3 first** (Inline Quiz, Learning Objectives, Video Script) as they deliver the most value for the training manager immediately. Phase 4 (Full Course Generation) is the "wow" feature but depends on the foundation from Phases 1-3.

