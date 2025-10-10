import { Form } from 'src/modules/form/form.schema';
import { FormFull } from '../schema/form-full.schema';

export function formFullMapper(form: Form, inscriptionId: string): FormFull {
  const formFull: FormFull = {
    _id: form._id, // herdado de BaseSchema
    inscriptionId: inscriptionId,
    name: form.name,
    sections: form.sections
      .filter((s) => s.deleted === false && s.active === true)
      .map((s) => ({
        _id: s._id,
        name: s.name,
        createdAt: s.createdAt!,
        updatedAt: s.updatedAt,
        questions: s.questions
          .filter((q) => q.deleted === false && q.active === true)
          .map((q) => ({
            _id: q._id,
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
