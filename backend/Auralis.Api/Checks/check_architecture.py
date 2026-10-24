"""Source-level architecture checks; not a C# compiler or runtime test."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
failures = []
checks = []
def check(ok, label):
    checks.append(label)
    if not ok: failures.append(label)
def source(folder):
    return [(p, p.read_text(encoding='utf-8-sig')) for p in (root / folder).glob('*.cs')]
for path, text in source('Controllers'):
    check(not re.search(r'AppDbContext|EntityFrameworkCore|Auralis\.Api\.(Repositories|Models)|HttpClient', text), f'{path.name}: no persistence/entity/HTTP-client dependency')
    ctor = re.search(r'public class \w+\((.*?)\)', text, re.S)
    check(ctor is not None and all(re.fullmatch(r'I\w+Service\s+\w+', part.strip()) for part in ctor.group(1).split(',')), f'{path.name}: inject Service interfaces only')
for path, text in source('Services'):
    check(not re.search(r'AppDbContext|EntityFrameworkCore|HttpClient|IOptions<|\.GetAsync\(|\.SendAsync\(|\.PostAsJsonAsync\(', text), f'{path.name}: no database/HTTP infrastructure')
    ctor = re.search(r'public class \w+\((.*?)\)\s*:\s*I\w+Service', text, re.S)
    if ctor:
        check(all(re.fullmatch(r'I\w+Repository\s+\w+', part.strip()) for part in ctor.group(1).split(',')), f'{path.name}: inject Repository interfaces only')
for path, text in source('Repositories'):
    check('Auralis.Api.Dtos' not in text and 'ControllerBase' not in text and not re.search(r'new (PoiDto|TranslateResponse|RouteResponse)\b', text), f'{path.name}: no API DTO or controller dependency')
program = (root / 'Program.cs').read_text()
implementations = []
for folder, suffix in [('Services', 'Service'), ('Repositories', 'Repository')]:
    all_text = '\n'.join(text for _, text in source(folder))
    for match in re.finditer(r'public class (\w+' + suffix + r')\([^)]*\)\s*:\s*(I\w+' + suffix + r')', all_text, re.S):
        concrete, interface = match.groups()
        implementations.append((interface, concrete))
        check(re.search(r'public interface ' + interface + r'\b', all_text) is not None, f'{concrete}: interface declared')
        check(len(re.findall(r'Add(?:Scoped|Transient|Singleton|HttpClient)\s*<\s*' + interface + r'\s*,\s*' + concrete + r'\s*>', program)) == 1, f'{concrete}: exactly one DI registration')
check(len(implementations) == 7, '3 Service and 4 Repository implementations covered')
check('Task<AudioGuide?>' in (root / 'Repositories/ITranslationRepository.cs').read_text(), 'Database translation repository returns an entity')
check('select translated;' in (root / 'Repositories/TranslationRepository.cs').read_text(), 'Database translation query materializes an entity')
check('new PoiDto(' in (root / 'Services/PoiService.cs').read_text(), 'POI entity mapping at Service')
check('new TranslateResponse(' in (root / 'Services/TranslationService.cs').read_text(), 'Translation mapping at Service')
check('new RouteResponse(' in (root / 'Services/RoutingService.cs').read_text(), 'Routing mapping at Service')
check('UseSqlServer(' in program, 'SQL Server provider retained')
for old in ['Services/TranslationService.cs', 'Services/RoutingService.cs']:
    text = (root / old).read_text()
    check(not re.search(r'public interface I\w+Service', text), old + ': interface kept in separate file')
print(f'{len(checks) - len(failures)}/{len(checks)} source checks passed.')
for message in failures: print('FAIL:', message)
raise SystemExit(bool(failures))
