
import * as vscode from 'vscode';
import { execFile } from 'child_process';

export function activate(context: vscode.ExtensionContext) {

    const command = vscode.commands.registerCommand(
        'fileage-tracker.scanFiles',
        () => {

            const folders = vscode.workspace.workspaceFolders;

            if (!folders) {
                vscode.window.showErrorMessage('Откройте проект!');
                return;
            }

            const projectPath = folders[0].uri.fsPath;

            const args = [
                'log',
                '-20',
                '--date=short',
                '--format=Коммит: %h%nАвтор: %an%nДата: %ad%nОписание: %s',
                '--name-only'
            ];

            execFile('git', args, { cwd: projectPath }, (error, stdout) => {

                if (error) {
                    vscode.window.showErrorMessage(
                        'Не удалось получить историю Git'
                    );
                    return;
                }

                const output = vscode.window.createOutputChannel(
                    'FileAge Tracker'
                );

                output.appendLine('ИСТОРИЯ ИЗМЕНЕНИЙ ПРОЕКТА');
                output.appendLine('----------------------------');
                output.appendLine(stdout);

                // Подсчёт количества коммитов каждого автора
                const authors = new Map<string, number>();

                const lines = stdout.split('\n');

                for (const line of lines) {

                    if (line.startsWith('Автор: ')) {

                        const author = line.substring(7);

                        const count = authors.get(author) || 0;

                        authors.set(author, count + 1);
                    }
                }

                output.appendLine('');
                output.appendLine('СТАТИСТИКА АВТОРОВ');
                output.appendLine('----------------------------');

                for (const [author, count] of authors) {
                    output.appendLine(`${author}: ${count} коммитов`);
                }

                output.show();
            });
        }
    );

    context.subscriptions.push(command);
}

export function deactivate() {}
