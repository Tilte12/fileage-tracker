
import * as vscode from 'vscode';
import { execFile } from 'child_process';

/**
 * Главная функция плагина FileAge Tracker.
 * Регистрирует команду просмотра истории Git
 * и подсчёта коммитов каждого автора.
 *
 * @param context Контекст расширения VS Code.
 * @returns Ничего не возвращает.
 */
export function activate(context: vscode.ExtensionContext): void {

    // Регистрируем команду, указанную в package.json
    const command = vscode.commands.registerCommand(
        'fileage-tracker.scanFiles',
        () => {

            // Получаем открытые папки проекта
            const folders = vscode.workspace.workspaceFolders;

            // Проверяем, что пользователь открыл проект
            if (!folders) {
                vscode.window.showErrorMessage('Откройте проект!');
                return;
            }

            // Получаем путь к первой открытой папке
            const projectPath = folders[0].uri.fsPath;

            /**
             * Аргументы команды git log:
             * -20 — последние 20 коммитов;
             * %h — хеш, %an — автор, %ad — дата;
             * %s — описание, %n — новая строка;
             * --name-only — изменённые файлы.
             */
            const args = [
                'log',
                '-20',
                '--date=short',
                '--format=Коммит: %h%nАвтор: %an%nДата: %ad%nОписание: %s',
                '--name-only'
            ];

            /**
             * Запускаем Git в папке проекта.
             * error — ошибка выполнения команды.
             * stdout — полученная история коммитов.
             */
            execFile('git', args, { cwd: projectPath }, (error, stdout) => {

                // Если Git завершился с ошибкой, показываем сообщение
                if (error) {
                    vscode.window.showErrorMessage(
                        'Не удалось получить историю Git'
                    );
                    return;
                }

                // Создаём канал Output для отображения результатов
                const output = vscode.window.createOutputChannel(
                    'FileAge Tracker'
                );

                output.appendLine('ИСТОРИЯ ИЗМЕНЕНИЙ ПРОЕКТА');
                output.appendLine('----------------------------');
                output.appendLine(stdout);

                /**
                 * Map хранит количество коммитов каждого автора.
                 * Ключ (string) — имя автора.
                 * Значение (number) — количество коммитов.
                 */
                const authors = new Map<string, number>();

                // Разбиваем текст Git на массив отдельных строк
                const lines = stdout.split('\n');

                // Перебираем строки, чтобы найти авторов коммитов
                for (const line of lines) {

                    if (line.startsWith('Автор: ')) {

                        // Убираем префикс "Автор: " и получаем имя
                        const author = line.substring(7);

                        // Получаем число коммитов или 0 для нового автора
                        const count = authors.get(author) || 0;

                        // Увеличиваем счётчик коммитов автора
                        authors.set(author, count + 1);
                    }
                }

                output.appendLine('');
                output.appendLine('СТАТИСТИКА АВТОРОВ');
                output.appendLine('----------------------------');

                // Выводим пары "автор — количество коммитов"
                for (const [author, count] of authors) {
                    output.appendLine(`${author}: ${count} коммитов`);
                }

                // Показываем результат пользователю
                output.show();
            });
        }
    );

    // VS Code автоматически освободит ресурс при выключении плагина
    context.subscriptions.push(command);
}

/**
 * Функция деактивации расширения.
 * Дополнительная очистка ресурсов не требуется.
 *
 * @returns Ничего не возвращает.
 */
export function deactivate(): void {}
