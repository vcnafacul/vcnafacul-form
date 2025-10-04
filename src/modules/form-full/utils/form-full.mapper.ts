import { Form } from 'src/modules/form/form.schema';
import { FormFull } from '../form-full.schema';

export function formFullMapper(form: Form): FormFull {
  const formFull: FormFull = {
    _id: form._id, // herdado de BaseSchema
    name: form.name,
    sections: form.sections.map((s) => ({
      name: s.name,
      createdAt: s.createdAt!,
      updatedAt: s.updatedAt,
      questions: s.questions.map((q) => ({
        text: q.text,
        helpText: q.helpText,
        answerType: q.answerType,
        collection: q.collection,
        options: q.options,
        createdAt: q.createdAt!,
        updatedAt: q.updatedAt,
      })),
    })),
  };

  return formFull;
}
