import { Test, TestingModule } from '@nestjs/testing';
import { shouldQuestionBeRequired } from './evaluate-conditions';
import { AnswerDto } from '../dto/create-submission.dto.input';
import { QuestionBase } from '../../form-full/schema/question-base.schema';
import { ComplexCondition } from '../../question/types/complex-condition';
import { BaseCondition } from '../../question/types/base-condition';
import { Operator } from '../../question/enum/operator';
import { Logic } from '../../question/enum/logic';
import { AnswerType } from '../../question/enum/answer-type';
import { AnswerCollectionType } from '../../question/enum/answer-collection-type';
import { Types } from 'mongoose';

describe('EvaluateConditions', () => {
  describe('shouldQuestionBeRequired', () => {
    it('should return true for questions without conditions', () => {
      const question: QuestionBase = {
        _id: new Types.ObjectId(),
        text: 'Simple question',
        answerType: AnswerType.Text,
        collection: AnswerCollectionType.Single,
        createdAt: new Date(),
      };

      const answers: AnswerDto[] = [];

      const result = shouldQuestionBeRequired(question, answers);
      expect(result).toBe(true);
    });

    it('should evaluate AND conditions correctly', () => {
      const questionId1 = new Types.ObjectId().toString();
      const questionId2 = new Types.ObjectId().toString();
      const currentQuestionId = new Types.ObjectId().toString();

      const question: QuestionBase = {
        _id: new Types.ObjectId(currentQuestionId),
        text: 'Conditional question',
        answerType: AnswerType.Text,
        collection: AnswerCollectionType.Single,
        conditions: {
          conditions: [
            {
              questionId: questionId1,
              operator: Operator.Equal,
              expectedValue: 'Yes',
            },
            {
              questionId: questionId2,
              operator: Operator.Equal,
              expectedValue: 'Active',
            },
          ],
          logic: Logic.And,
        },
        createdAt: new Date(),
      };

      // Test case 1: Both conditions met
      const answers1: AnswerDto[] = [
        { questionId: questionId1, answer: 'Yes', question: 'Question 1' },
        { questionId: questionId2, answer: 'Active', question: 'Question 2' },
      ];

      expect(shouldQuestionBeRequired(question, answers1)).toBe(true);

      // Test case 2: Only one condition met (AND should fail)
      const answers2: AnswerDto[] = [
        { questionId: questionId1, answer: 'Yes', question: 'Question 1' },
        { questionId: questionId2, answer: 'Inactive', question: 'Question 2' },
      ];

      expect(shouldQuestionBeRequired(question, answers2)).toBe(false);
    });

    it('should evaluate OR conditions correctly', () => {
      const questionId1 = new Types.ObjectId().toString();
      const questionId2 = new Types.ObjectId().toString();

      const question: QuestionBase = {
        _id: new Types.ObjectId(),
        text: 'OR conditional question',
        answerType: AnswerType.Text,
        collection: AnswerCollectionType.Single,
        conditions: {
          conditions: [
            {
              questionId: questionId1,
              operator: Operator.Equal,
              expectedValue: 'Option1',
            },
            {
              questionId: questionId2,
              operator: Operator.Equal,
              expectedValue: 'Option2',
            },
          ],
          logic: Logic.Or,
        },
        createdAt: new Date(),
      };

      // Test case 1: First condition met
      const answers1: AnswerDto[] = [
        { questionId: questionId1, answer: 'Option1', question: 'Question 1' },
        { questionId: questionId2, answer: 'Other', question: 'Question 2' },
      ];

      expect(shouldQuestionBeRequired(question, answers1)).toBe(true);

      // Test case 2: Second condition met
      const answers2: AnswerDto[] = [
        { questionId: questionId1, answer: 'Other', question: 'Question 1' },
        { questionId: questionId2, answer: 'Option2', question: 'Question 2' },
      ];

      expect(shouldQuestionBeRequired(question, answers2)).toBe(true);

      // Test case 3: Neither condition met
      const answers3: AnswerDto[] = [
        { questionId: questionId1, answer: 'Other', question: 'Question 1' },
        { questionId: questionId2, answer: 'Other', question: 'Question 2' },
      ];

      expect(shouldQuestionBeRequired(question, answers3)).toBe(false);
    });

    it('should handle different operators correctly', () => {
      const questionId = new Types.ObjectId().toString();

      // Test GreaterThan
      const question1: QuestionBase = {
        _id: new Types.ObjectId(),
        text: 'Number question',
        answerType: AnswerType.Number,
        collection: AnswerCollectionType.Single,
        conditions: {
          conditions: [
            {
              questionId: questionId,
              operator: Operator.GreaterThan,
              expectedValue: 18,
            },
          ],
          logic: Logic.And,
        },
        createdAt: new Date(),
      };

      const answers1: AnswerDto[] = [
        { questionId: questionId, answer: 25, question: 'Age question' },
      ];

      expect(shouldQuestionBeRequired(question1, answers1)).toBe(true);

      const answers2: AnswerDto[] = [
        { questionId: questionId, answer: 16, question: 'Age question' },
      ];

      expect(shouldQuestionBeRequired(question1, answers2)).toBe(false);
    });

    it('should handle Contains operator for arrays', () => {
      const questionId = new Types.ObjectId().toString();

      const question: QuestionBase = {
        _id: new Types.ObjectId(),
        text: 'Multi-select question',
        answerType: AnswerType.Options,
        collection: AnswerCollectionType.Multiple,
        conditions: {
          conditions: [
            {
              questionId: questionId,
              operator: Operator.Contains,
              expectedValue: 'Option1',
            },
          ],
          logic: Logic.And,
        },
        createdAt: new Date(),
      };

      const answers1: AnswerDto[] = [
        { questionId: questionId, answer: ['Option1', 'Option2'], question: 'Multi question' },
      ];

      expect(shouldQuestionBeRequired(question, answers1)).toBe(true);

      const answers2: AnswerDto[] = [
        { questionId: questionId, answer: ['Option2', 'Option3'], question: 'Multi question' },
      ];

      expect(shouldQuestionBeRequired(question, answers2)).toBe(false);
    });
  });
});
