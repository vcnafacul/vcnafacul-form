import { Form } from 'src/modules/form/form.schema';
import { FormFull } from '../schema/form-full.schema';
import { Section } from 'src/modules/section/section.schema';
import { SectionBase } from '../schema/section-base.schema';
import { Types } from 'mongoose';

function mapSection(s: Section, isGlobal: boolean): SectionBase {
  const filteredQuestions = s.questions.filter(
    (q) => !q.deleted && q.active === true,
  );

  return {
    _id: s._id,
    name: s.name,
    description: s.description ?? '',
    isGlobal,
    createdAt: s.createdAt!,
    updatedAt: s.updatedAt,
    questions: filteredQuestions.map((q) => ({
      _id: q._id,
      text: q.text,
      helpText: q.helpText,
      answerType: q.answerType,
      collection: q.collection,
      conditions: q.conditions,
      options: q.options,
      createdAt: q.createdAt!,
      updatedAt: q.updatedAt,
    })),
  };
}

export function formFullMapper(
  globalForm: Form,
  partnerForm: Form | null,
  inscriptionId: string,
): FormFull {
  const globalSections = (globalForm.sections ?? [])
    .filter((s) => !s.deleted && s.active === true)
    .map((s) => mapSection(s, true))
    .filter((s) => s.questions.length > 0);

  const partnerSections = partnerForm
    ? (partnerForm.sections ?? [])
        .filter((s) => !s.deleted && s.active === true)
        .map((s) => mapSection(s, false))
        .filter((s) => s.questions.length > 0)
    : [];

  // Law 4: global sections primeiro, depois partner sections
  return {
    _id: new Types.ObjectId(),
    inscriptionId,
    name: globalForm.name,
    globalFormId: globalForm._id.toString(),
    partnerFormId: partnerForm?._id.toString() ?? null,
    sections: [...globalSections, ...partnerSections],
  };
}
