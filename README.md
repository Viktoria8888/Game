# Game

### Literatura

- "Writing Effective Use Cases" Alistair Cockburn

Liczba reguł = N
Powiązanie z CSP:
Sloty = zmienne.
Dostępne kursy = domena.
Zasady = ograniczenia.

### Przypadki użycia
UC-01: Dodanie kursu do harmonogramu
Opis: Gracz wybiera kurs z puli dostępnych kursów i umieszcza go w wybranych slocie czasowym w harmonogramie.
Cel: Aktualizacja stanu harmonogramu i natychmiastowa walidacja wszystkich zasad.
Aktor: Gracz
Scenariusz główny:
1) Gracz wybiera kurs.
2) Gracz przypisuje kurs do wolnego slotu
3) System aktualizuje Schedule Signal (lub coś podobnego)
4) Funkcja validate() sprawdza wszystkie ograniczenia (R1-RN)
5) Siatka jest odswieżona. Pokazuje też ewentualne błędy i kolizje

