type LogLevel = 'INFO' | 'ERROR';

function log(level: LogLevel, message: string, details: Record<string, unknown> = {}): void {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...details
  };

  const output = level === 'ERROR' ? console.error : console.log;
  output(JSON.stringify(payload));
}

export function info(message: string, details: Record<string, unknown> = {}): void {
  log('INFO', message, details);
}

export function error(message: string, details: Record<string, unknown> = {}): void {
  log('ERROR', message, details);
}
