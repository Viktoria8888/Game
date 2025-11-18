# Game

### Literatura

- "Writing Effective Use Cases" Alistair Cockburn
- "Constraint Satisfaction Techniques in Planning and Scheduling" Roman Bart´ak1, Miguel A. Salido2, Francesca Rossi

### Podejście do gry

Liczba reguł = N
Dla uproszczenia gry, uzywamy Zasad Celu Etapu($R_{goal}$) zamiast wymagania, żeby wszystkie N reguł były spełnione (jak to jest w The Password Game)
Niektóre zasady pozostaną akumulacyjne.
Poziomy będą podzielone na semestry.
Po spełnieniu $R_{goal}$ dla 7 semestru użytkownik dostaje "dyplom ukończenia studiów".

### Reguly

#### SEMESTER 1:

R1: ECTS Minimum Base (Cumulative)
- Total sum of ECTS is greater than 18

R2: ECTS Maximum Base (Cumulative)
- Total sum of ECTS is at most 30 ?

R3: No Collision (Cumulative)

R4: Core Sequence I (Cumulative)
- Mandatory course for the first year should be added

R5: First Year Recommendation(Goal)
- more than 8 ECTS

R6: Type Diversity (Additional)
---



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

