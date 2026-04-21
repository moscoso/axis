import { PreconditionValidator, validate } from '@moscoso/models';
import { TableError } from '../TableError/TableError';

export type TablePreconditionValidator = PreconditionValidator<TableError>;

export const validateTable = (preconditions: TablePreconditionValidator[], args: any) =>
	validate<TableError>(preconditions, args);
