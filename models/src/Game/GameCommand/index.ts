/*
 * GameCommands must be exported first — GameCommand.ts imports this barrel
 * to build the factory, so the namespace must be resolved before that module loads.
 * Reordering these exports will cause GameCommandFactory to initialize with undefined.
 */
export * as GameCommands from './commands';
export * from './GameCommand';
export * from './GameCommandResult';
