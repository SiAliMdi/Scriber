import re
import unicodedata as ud
from cleantext.clean import clean  # <-- FIXED IMPORT
import json

mois = "(janvier|février|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)"
transitions = r"|".join([
    "AINSI", 
    "APPELANT[E]?[S]?",
    "Appelant[e]?[s]?",
    "APPELANT\(E/S\)",
    "Appelant\(e/s\)",
    "APR[E|È]S",
    "ARR[E|Ê]T[S]?",
    "Arrêt du",
    "AU FOND",
    "Au [F|f]ond",
    "CECI", 
    "CECI [E|É]TANT",
    "Ceci étant",
    "(?:LES |LA )?CONCLUSION[S]?",
    "Conclusion[s]?",
    "LA COUR",
    "La [C|c]our",
    "COUR",
    "(?:LA )?COMPOSITION",
    "(?:LES )?D[E|É]BATS",
    "Débats",
    "D[E|É]CISION",
    "D[E|É]FEN[S|D]E(?:UR|RESSE)[S]?",
    "D[é|e]fen[s|d]e(?:ur|resse)[s]?",
    "DEMANDE(?:UR|RESSE)[S]?",
    "Demande(?:ur|resse)[s]?",
    "(?:LA )?DISCUSSION[S]?",
    "DISPOSITIF", 
    "D I S P O S I T I F",
    "Dispositif",
    "EN CONS[E|É]QUENCE",
    "En conséquence,",
    "EN LA FORME",
    "ENTRE",
    "ET[,| ?:]",
    "EXPOS[E|É][S]?",
    "Exposé",
    "(?:LES )?FAIT[S]?",
    "F A I T S",
    "Fait[s]?",
    "GREFFIER",
    "INTIM[E|É][E]?[S]?",
    "INTIM[E|É]\(E/S\)",
    "Intim[é|e][e]?[s]?",
    "Intim[e|é]\(e/s\)",
    "INTERVENANT[S]?",
    "(?:A-Z|À|É| )+ MOTIF[S]?",
    "(?:LES )?MOTIFS", 
    "M O T I F S",
    "Motifs", 
    "(?:LES |LA )?MOTIVATION[S]?",
    "(?:Les |La )?Motivation[s]?",
    "(?:A-Z|À|É| )+ MOYEN[S]?",
    "(?:LE[S]? )?MOYEN[S]?", 
    "(?:Le[s]? )Moyen[s]?", 
    "NOUS",
    "Nous",
    "ORDONNANCE",
    "O R D O N N A N C E",
    "Ordonnance",
    "PAR", 
    "P A R",
    "(?:LES |LA )?PARTIE[S]?",
    "Les parties",
    #"PAR CES MOTIFS",
    "Par [C|c]es [M|m]otifs",
    #"PAR (?:JUGEMENT|D[E|É]CISION)", 
    #"PAR JUGEMENT",
    "(?:LES |LA )?PROC[E|É]DURE[S]?", 
    "P R O C [E|É] D U R E ?S?",
    "(?:LES |LA )?PR[E|É]TENTION[S]?",
    "P R [E|É] T E N T I O N ?S?",
    "(?:Les |La )?Pr[e|é]tention[s]?",
    "Procédure", 
    "(?:LE[S]? )?RAPPEL[S]?",
    "(?:Le[s]? )Rappel[s]?",
    "R[E|É]FORME",
    "Réforme",
    "R[E|É]PUBLIQUE",
    "STATUANT",
    "S T A T U A N T",
    "Statuant",
    "SUIVANT",
    "Suivant",
    "S U R",
    "SUR CE", 
    "Sur [C|c]e", 
    "SUR L(?:'[A-ZÀ-Ý]+|E|A|ES)",
    "Sur [L|l](?:'[a-zà-ÿ]+|e|a|es)",
    "SUR QUOI", 
    "Sur [Q|q]uoi", 
    "\d+ ?[.|/|°|-] ?[A-Z]+,?"
    ])
#splitter = SentenceSplitter(language='fr')

def normalize_text(text, tcp=False):

    text = ud.normalize('NFD', text)
    text = clean(
        text,
        fix_unicode=True,
        to_ascii=False,
        lower=False,
        normalize_whitespace=False,
        lang="fr"
    )

    if tcp:
        text = re.sub("\n{2,}", "\n\n", text)
    else:
        text = re.sub("\n+", "\n", text)

    text = text.replace("–", "-")
    text = text.split("\n")
    text = "\n".join([t.strip() for t in text if len(
        t.strip()) != 1 and len(set(t.strip())) != 1])
    return text

def clean_tcp(text):
    text = re.sub(r"\|G? +\|", " ", text)
    text = re.sub(r"\|\n", "\n", text)
    text = text.replace("|", "\n")
    return text

def strip_spaces(text):
    text = re.sub(r" +", " ", text)
    text = re.sub(r" ?\n ?", r"\n", text)
    text = re.sub(r"([a-zà-ÿ])(\n)([a-zà-ÿ])", r"\1 \3", text)
    return text 

def process_transitions(text):
    # lower \n lower/digits
    text = re.sub(r"\n([a-zà-ÿ]|\(|\[)", r" \1", text)
    text = re.sub(r"([a-zà-ÿ0-9])\n([a-zà-ÿ0-9])", r"\1 \2", text)

    # frequent transition
    text = re.sub(r" (de|du|des|à|à|aux|au|le|la|l'|les|par|pour|et|que|qu'|avec|sur|après)(\n+)([A-Za-z0-9_À-ÿ,-])",
                  r" \1 \3", text, flags=re.IGNORECASE)

    # transition again
    text = re.sub(r"(([A-Z]+|;)|([a-zà-ÿ0-9]+|.|;)) (Le |La |Les |Que |Qu'|Pour |Par |Vu |Ils |Elles |Il |Elle |Attendu |Dit )",
                  r"\1\n\4", text, flags=re.UNICODE)

    # transition communes
    text = re.sub(r"(monsieur|madame)(\n+)", r"\1 ", text, flags=re.IGNORECASE)
    text = re.sub(r"(Société)(\n+)", r"\1 ", text)
    text = re.sub(r"(\n+)(Attendu)", r"\n\2", text)

    # titres
    text = re.sub(r"(\n+)(\d+ ?[\)|-|/] ?)?(" + transitions + r")([,|;|\.|:|\n|\s]+)", r"\n\n\2\3\4", text)
    text = re.sub(r"(\n+)([V|I]+)( ?[-|.|/|\)] ?[A-Z]?)", r"\n\n\2\3", text)
    #text = re.sub(r"(\n+)(\d+\) [A-Z]+\s)", r"\n\n\2", text)
    #text = re.sub(r"(\n+)(\d+\)\s)", r"\n\n\2 AA\n", text)
    #text = re.sub(r"(\n+)([V|I]+ ?[-|.|/|\)] ?)", r"\n\n\2 AA\n", text)
    return text 

def process_enumerations(text):
    # text = re.sub(r"(\s)(- ?)(\w+)", r"\n\2\3", text)
    text = re.sub(r"(\w+)(-)(\n)(\w+)", r"\1\2\4", text)
    text = re.sub(r"(\w+)( -)(\n)(\w+)", r"\1\2 \4", text)
    text = re.sub(r" •", r"\n•", text)
    text = re.sub(r"(\n+)(\"|\(|•|-|\')", r"\n\2", text)
    text = re.sub(r"(,|;|:)(\n+)(^[A-Z]+[ |\n])", r"\1\n\3", text)
    return text

def process_date(text):
    # Mois/date
    text = re.sub(r"(\n)" + mois,
                  r" \2", text, flags=re.IGNORECASE)
    return text 
    
def process_digits(text):
    # monnaie
    text = re.sub(r"(\n)(€|€uros|euro|euros|usd|f|francs|franc|fr|TTC)([\s,.])",
                  r" \2\3", text, flags=re.IGNORECASE)

    # digits
    text = re.sub(r"\n(\d+)\n", r" \1\n", text)
    text = re.sub(r"(\d+)\n([A-Z]+)", r"\1 \2", text)
    text = re.sub(r"(\+|[0-9])\n(\+|[0-9])", r"\1 \2", text)
    return text 

def final_cleanup(text):
    # punc
    text = re.sub(r"(\n)(«|-|\"|\')(\s)", r"\1\2 ", text)
    text = re.sub(r"(\n)([»|;|:|,|\.|\"|\']+)(\s)", r" \2\3", text)

    # juridication
    text = re.sub(r"(COUR D['APPEL|E] ?[A-Z]+?)\s+(DE|D')\s+([A-Z]+)", r"\1 \2 \3", text)

    #
    if text[:5] == "Texte":
        text = text[5:]

    # last clean up
    text = "\n".join([t.strip()
                     for t in text.split("\n") if len(t.strip()) != 1])
    text = re.sub(r"(\n)\1{2,}", r"\1\1", text, flags=re.UNICODE)
    text = re.sub(r"([a-zà-ÿ])\n([a-zà-ÿ])", r"\1 \2", text)
    return text.strip()

def clean_text(text, is_tcp=False):

    # clean tcp
    if is_tcp:
        text = clean_tcp(text)

    # Normalize
    text = normalize_text(text, tcp=is_tcp)

    # strip whitespace
    text = strip_spaces(text)

    # transitions
    text = process_transitions(text)
    
    # Mois/date
    text = process_date(text)
    
    # - •
    text = process_enumerations(text)
    
    # upper\n upper
    #text = re.sub(r" ([A-Z]+|[A-Z][a-zà-ÿ]+)\n([A-Z]+ )", r" \1 \2", text)
    
    # monnaie/digits
    text = process_digits(text)
    
    # last clean up
    text = final_cleanup(text)
    
    return text

def write_file(file_path, text):
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

def write_json(file_path, text):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(text, f, indent=4, ensure_ascii=False)

def read_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    return text