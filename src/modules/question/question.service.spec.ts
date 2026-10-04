import { Types } from 'mongoose';

// O schema do Mongoose não carrega neste modo de teste; o service só usa a
// classe para o `plainToInstance`.
jest.mock('./question.schema', () => ({ Question: class Question {} }));
jest.mock('./question.repository', () => ({ QuestionRepository: class {} }));
jest.mock('../section/section.repository', () => ({ SectionRepository: class {} }));

import { QuestionSevice } from './question.service';
import { AnswerType } from './enum/answer-type';
import { AnswerCollectionType } from './enum/answer-collection-type';

/** Repositórios dublados: o que importa é o que chega para gravar. */
function montar() {
  const session = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    endSession: jest.fn(),
  };
  const existente = {
    _id: new Types.ObjectId(),
    text: 'Renda',
    helpText: 'Some a renda de todos (2025)',
    conditions: {
      logic: 'And',
      conditions: [{ questionId: 'q1', operator: 'Equal', expectedValue: 'Sim' }],
    },
  };
  const repository = {
    startSession: jest.fn().mockResolvedValue(session),
    create: jest.fn((e: Record<string, unknown>) =>
      Promise.resolve({ _id: new Types.ObjectId(), ...e }),
    ),
    findById: jest.fn().mockResolvedValue(existente),
    updateFields: jest.fn(),
    model: { find: jest.fn().mockResolvedValue([]) },
  };
  const sectionRepository = {
    findById: jest.fn().mockResolvedValue({ questions: [] }),
    updateOne: jest.fn(),
  };
  const service = new QuestionSevice(repository as never, sectionRepository as never);
  return { service, repository, existente };
}

describe('QuestionSevice', () => {
  describe('criar com a chave Questão Ativa (tickets-documentacao, 24)', () => {
    const dto = {
      sectionId: 's1',
      text: 'Nova',
      answerType: AnswerType.Text,
      collection: AnswerCollectionType.Single,
    };

    it('⚠️ desligada: nasce inativa', async () => {
      const { service, repository } = montar();
      await service.create({ ...dto, active: false });
      expect(repository.create.mock.calls[0][0]).toMatchObject({ active: false });
    });

    it('sem a chave: fica o padrão do schema (ativa)', async () => {
      const { service, repository } = montar();
      await service.create(dto);
      expect(repository.create.mock.calls[0][0].active).toBeUndefined();
    });
  });

  describe('editar: apagar ajuda e remover condições (tickets-documentacao, 22)', () => {
    it('helpText "" e conditions null são gravados (null não é validado)', async () => {
      const { service, repository } = montar();
      await service.update('q2', { helpText: '', conditions: null } as never);
      expect(repository.updateFields).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ helpText: '', conditions: null }),
      );
    });
  });

  describe('condição com referência inativa (tickets-documentacao, 23)', () => {
    it('⚠️ mesmas condições reenviadas: edita o texto sem validar de novo', async () => {
      const { service, repository, existente } = montar();
      await service.update('q2', {
        text: 'Renda (corrigido)',
        conditions: existente.conditions,
      } as never);
      expect(repository.model.find).not.toHaveBeenCalled();
      expect(repository.updateFields).toHaveBeenCalled();
    });

    it('condições novas com referência inativa: recusa citando o texto', async () => {
      const { service, repository } = montar();
      repository.model.find
        .mockResolvedValueOnce([]) // ativas
        .mockResolvedValueOnce([{ _id: 'q9', text: 'Você mora sozinho?' }]);
      await expect(
        service.update('q2', {
          conditions: {
            logic: 'And',
            conditions: [
              { questionId: 'q9', operator: 'Equal', expectedValue: 'Não' },
              { questionId: 'q8', operator: 'Equal', expectedValue: 'x' },
            ],
          },
        } as never),
      ).rejects.toMatchObject({
        message:
          'As condições apontam para questões inativas ou excluídas: "Você mora sozinho?" (inativa), uma questão excluída',
      });
      expect(repository.updateFields).not.toHaveBeenCalled();
    });
  });
});
