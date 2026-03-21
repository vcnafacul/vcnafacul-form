import { Form } from 'src/modules/form/form.schema';
import { FormFull } from '../schema/form-full.schema';
import { Types } from 'mongoose';
import { Section } from 'src/modules/section/section.schema';

function mapSections(sections: Section[]) {
  return sections.map((s) => ({
    _id: s._id,
    name: s.name,
    createdAt: s.createdAt!,
    updatedAt: s.updatedAt,
    questions: s.questions.map((q) => ({
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
  }));
}

export function formFullMapper(
  globalForm: Form | null,
  partnerForm: Form | null,
  inscriptionId: string,
): FormFull {
  const globalSections = globalForm ? mapSections(globalForm.sections) : [];
  const partnerSections = partnerForm ? mapSections(partnerForm.sections) : [];

  const name = partnerForm?.name ?? globalForm?.name ?? 'Formulário';

  const formFull: FormFull = {
    _id: new Types.ObjectId(),
    inscriptionId,
    name,
    sections: [...globalSections, ...partnerSections],
  };

  return formFull;
}
