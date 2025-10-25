# Game

### Literatura

- "Writing Effective Use Cases" Alistair Cockburn
- "Constraint Satisfaction Techniques in Planning and Scheduling" Roman Bart´ak1, Miguel A. Salido2, Francesca Rossi
### Powiązanie z CSP:

Sloty = zmienne.
Dostępne kursy = domena.
Zasady = ograniczenia.

### Podejście do gry

Liczba reguł = N

Dla uproszczenia gry, uzywamy Zasad Celu Etapu($R_{goal}$) zamiast wymagania, żeby wszystkie N reguł były spełnione (jak to jest w The Password Game)
Niektóre zasady pozostaną akumulacyjne.
Poziomy będą podzielone na semestry.
Po spełnieniu $R_{goal}$ dla 7 semestru użytkownik dostaje "dyplom ukończenia studiów".

### Pula zasad

**Zasady kumulacyjne**: Te zasady są ciągłe i zawsze aktywne (po ich aktywacji), ponieważ stanowią podstawę programu studiów i logiki harmonogramowania.

| ID  | Semestr | Kategoria   | Nazwa                      | Opis                                                                                                                                   |
| --- | ------- | ----------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | 1–7     | Kumulacyjna | ECTS Minimum Base          | Łączna suma ECTS musi wynosić co najmniej 18 (za semestr, na start).                                                                   |
| R2  | 1–7     | Kumulacyjna | No Collision Base          | Żaden kurs nie może nakładać się w czasie z innym kursem.                                                                              |
| R3  | 1–7     | Kumulacyjna | Core Sequence I            | W planie bieżącego Semestru N, MUSZĄ znaleźć się wszystkie przedmioty obowiązkowe przypisane do Semestru N (i tylko te).               |
| R4  | 1       | Goal        | Type Diversity             | Musisz mieć w planie min. dwa różne kursy typu Laboratorium/Projekt i min. 1 kurs typu Seminarium.                                     |
| R5  | 1       | Dodatkowa   | First Year Recommendation  | Co najmniej 8 ECTS musi pochodzić z kursów oznaczonych jako isFirstYearRecommended = true.                                             |
| R6  | 1       | Dodatkowa   | ECTS Target                | Łączna suma ECTS musi wynosić dokładnie 20.                                                                                            |
| R7  | 2       | Goal        | Midday Break               | Żadne zajęcia nie mogą rozpoczynać się w przedziale 12:00 – 13:00.                                                                     |
| R8  | 2       | Dodatkowa   | Tools Requirement (K)      | ≥4 ECTS musi pochodzić z kursów oznaczonych tagiem 'K' (Narzędzia informatyki).                                                        |
| R9  | 2       | Dodatkowa   | Exam ECTS Minimum          | Suma ECTS z kursów zakończonych egzaminem (Egz=+) musi być ≥9.                                                                         |
| R10 | 3       | Goal        | Required Conflict          | Musisz mieć dokładnie jedną kolizję w harmonogramie. (R10 kontroluje R2).                                                              |
| R11 | 3       | Dodatkowa   | English Language           | Musisz mieć co najmniej jeden kurs prowadzony w języku angielskim.                                                                     |
| R12 | 3       | Dodatkowa   | No Gaps                    | Nie może być przerwy dłuższej niż 60 minut między zajęciami w tym samym dniu.                                                          |
| R13 | 4       | Goal        | The Free Day               | Musisz mieć jeden całkowicie wolny dzień (Pon/Śr/Pt).                                                                                  |
| R14 | 4       | Dodatkowa   | Analytic Prerequisites     | Nie możesz mieć kursów oznaczonych jako 'E' (Tematyczny), jeśli nie masz w planie Analizy Numerycznej.                                 |
| R15 | 4       | Dodatkowa   | Morning Dominance          | Suma godzin zajęć rozpoczynających się przed 11:00 musi być większa niż suma godzin po 14:00.                                          |
| R16 | 5       | Goal        | Humanities Focus (HS)      | Łącznie ≥5 ECTS musi pochodzić z przedmiotów humanistyczno-społecznych (HS).                                                           |
| R17 | 5       | Dodatkowa   | Odd ECTS Sum               | Całkowita suma ECTS z kursów odbywających się w środy i czwartki musi być liczbą nieparzystą.                                          |
| R18 | 5       | Dodatkowa   | Project Isolation          | Kurs typu 'Projekt' nie może być ostatnim kursem dnia.                                                                                 |
| R19 | 6       | Goal        | Specialization Focus       | Łącznie ≥8 ECTS musi pochodzić z kursów oznaczonych tagiem 'ASK' lub 'BD' (specjalizacyjne).                                           |
| R20 | 6       | Dodatkowa   | Proseminarium Requirement  | W planie musi znaleźć się co najmniej jedno Proseminarium.                                                                             |
| R21 | 6       | Dodatkowa   | Metarule: The Compensation | Jeśli spełnisz R16 (Humanities Focus), R1 (ECTS Minimum) jest tymczasowo ignorowana (redukując ciśnienie ECTS).                        |
| R22 | 7       | Goal        | The Ultimate Check         | Wszystkie globalne wymogi z tabeli końcowej (np. 66 ECTS 'I', 170 ECTS ogółem) muszą być spełnione łącznie we wszystkich 7 semestrach. |

### Przypadki użycia

**UC-01: Dodanie kursu do harmonogramu**
Opis: Gracz wybiera kurs z puli dostępnych kursów i umieszcza go w wybranych slocie czasowym w harmonogramie.
Cel: Aktualizacja stanu harmonogramu i natychmiastowa walidacja wszystkich zasad.
Aktor: Gracz
Scenariusz główny:

1. Gracz wybiera kurs.
2. Gracz przypisuje kurs do wolnego slotu
3. System aktualizuje Schedule Signal (lub coś podobnego)
4. Funkcja validate() sprawdza wszystkie ograniczenia (R1-RN)
5. Siatka jest odswieżona. Pokazuje też ewentualne błędy i kolizje

**UC-02: Usunięcie kursu z harmonogramu**
Opis: Gracz usuwa dodany kurs z harmonogramu.
Cel: Uwolnienie slotu i walidacja zasad
Aktor: Gracz
Scenariusz główny:

1. Gracz usuwa kurs.
2. System usuwa kurs z Schedule Signal
3. System aktualizuje Schedule Signal (lub coś podobnego)
4. Funkcja validate() sprawdza wszystkie ograniczenia (R1-RN)
5. Siatka jest odswieżona.

**UC-03: Walidacja zasad**
Opis: System sprawdza, które zasady zostały spełnione, a które nie.
Cel: Informowanie gracza o blędach i kolizjach.
Scenariusz główny:

1. Funkcja validate(schedule) iteruje po wszystkich zasadach
2. Każda zasada zwraca status: Spełniona / Niespełniona / Ignorowana
3. System aktualizuje UI

**UC-04: Obsługa sprzecznych zasad**
Opis: System rozstrzyga konflikty między zasadami (R6 wymusza złamanie R5)
Cel: Priorytetyzacja i dynamiczne ignorowanie niektórych ograniczeń.
Scenariusz główny:

1. Walidacja wykrywa kolizję
2. Algorytm ustala status reguł zgodnie z priorytetem
3. UI aktualizuje wizualizację

**UC-05: Wczytanie harmonogramu z Firestore**
Opis: Pobranie postępu gracza z bazy.
Cel: Kontynuacja gry w poprzednim stanie
Scenariusz główny:

1. Gracz loguje sie za pomocą Firebase Auth
2. System pobiera dokument z harmonogramem (onSnapshot)
3. Schedule Signal zostaje zaktualizowany
4. UI odświeża siatkę

**UC-06: Zapis harmonogramu do Firestore**
Opis: Automatyczny lub ręczny zapis postępu gry
Cel: Trwałe przechowywanie danych.
Scenariusz główny:

1. Gracz dodaje/usuwa kurs -> Schedule Signal się zmienia
2. System zapisuje dokument w Firestore (setDoc)
3. Reguły biezpieczeństwa Firebase weryfikują UID użytkownika

**UC-07: Wyświetlanie szczegółowych komunikatów błędów**
Opis: UI pokazuje, które dokłasnie zasady są niespełnione i dlaczego.
Cel: Łatwiejsze zrozumienie gry
Scenariusz głowny:

1. validate generuje obiekt "diagnostyczny"
2. UI tworzy alert z dokładnych opisem błędu

**UC-08: Przejście poziomu (Zakonczenie gry)**
Cel: Wprowadzenie nowych zasad i zachowanie starego, spójnego stanu harmonogramu.
Scenariusz główny:

1. System stwierdza, że wszystkie R1​−RN​ są spełnione.
2. Użytkownik klika "Przejdź Poziom".
3. System odblokowuje RN+1​,RN+2​,… (nowe ograniczenia).
4. Walidacja natychmiast się uruchamia, informując, czy harmonogram spełnia już nowe zasady.
