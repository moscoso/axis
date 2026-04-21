/*
 * TableCommands must be exported first — TableCommand.ts imports this barrel
 * to build the factory, so the namespace must be resolved before that module loads.
 * Reordering these exports will cause TableCommandFactory to initialize with undefined.
 */
export * as TableCommands from './commands';
export * from './TableCommand';
export * from './TableCommandResult';
