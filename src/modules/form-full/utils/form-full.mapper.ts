import { Form } from 'src/modules/form/form.schema';
import { FormFull } from '../schema/form-full.schema';
import { Types } from 'mongoose';

export function formFullMapper(form: Form, inscriptionId: string): FormFull {
  const filteredSections = form.sections.filter((s) => !s.deleted && s.active === true);

  const formFull: FormFull = {
    _id: new Types.ObjectId(),
    inscriptionId: inscriptionId,
    name: form.name,
    sections: filteredSections.map((s) => {
      const filteredQuestions = s.questions.filter((q) => !q.deleted && q.active === true);

      return {
        _id: s._id,
        name: s.name,
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
    }),
  };

  return formFull;
}
