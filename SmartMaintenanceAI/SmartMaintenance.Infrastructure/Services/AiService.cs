using Microsoft.Extensions.Configuration;
using SmartMaintenance.Application.Interfaces;
using System.Text;
using System.Text.Json;

namespace SmartMaintenance.Infrastructure.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _apiKey;

        // Base de connaissances intégrée pour le mode simulation
        private static readonly Dictionary<string, string> KnowledgeBase = new(StringComparer.OrdinalIgnoreCase)
        {
            // Salutations
            { "bonjour", "Bonjour ! 👋 Je suis l'assistant IA de SmartMaintenance. Je peux vous aider avec :\n\n• **Diagnostic de pannes** — Décrivez un symptôme et je vous guiderai.\n• **Procédures de maintenance** — Étapes à suivre pour l'entretien.\n• **Sécurité** — EPI et consignes de sécurité.\n• **Gestion des stocks** — Seuils et réapprovisionnement.\n\nComment puis-je vous aider ?" },
            { "salut", "Salut ! 👋 Je suis prêt à vous assister. Posez-moi une question sur la maintenance, les équipements ou les interventions !" },
            { "hello", "Hello ! 👋 Bienvenue sur l'assistant SmartMaintenance. Comment puis-je vous aider aujourd'hui ?" },
            { "merci", "De rien ! 😊 N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider." },
        };

        private static readonly List<(string[] keywords, string response)> TopicResponses = new()
        {
            // Pompe hydraulique
            (new[] { "pompe", "hydraulique", "surchauffe", "température" },
             "🔧 **Diagnostic — Surchauffe Pompe Hydraulique**\n\nCauses possibles :\n1. **Niveau d'huile insuffisant** — Vérifiez le réservoir et complétez si nécessaire.\n2. **Filtre colmaté** — Remplacez le filtre à huile haute pression (Réf: REF-FHP-101).\n3. **Viscosité incorrecte** — Vérifiez que l'huile correspond aux spécifications du fabricant.\n4. **Roulement usé** — Contrôlez les vibrations et le bruit anormal.\n\n⚠️ **Sécurité** : Laissez refroidir l'équipement avant toute intervention. Portez des gants résistants à la chaleur."),

            // Moteur électrique
            (new[] { "moteur", "électrique", "vibration", "bruit" },
             "🔧 **Diagnostic — Moteur Électrique**\n\nSi vous constatez des vibrations ou bruits anormaux :\n1. **Vérifiez l'alignement** de l'arbre moteur.\n2. **Inspectez les roulements** — Un bruit de grondement indique une usure.\n3. **Contrôlez la tension** d'alimentation (doit être ±10% de la valeur nominale).\n4. **Vérifiez l'équilibrage** du rotor.\n\n📋 **Action recommandée** : Créez une intervention de priorité \"Haute\" si les vibrations dépassent 4.5 mm/s."),

            // Compresseur
            (new[] { "compresseur", "air", "pression" },
             "🔧 **Diagnostic — Compresseur d'Air**\n\nProblèmes fréquents :\n1. **Pression insuffisante** — Vérifiez les fuites dans le circuit pneumatique.\n2. **Surchauffe** — Nettoyez le radiateur et vérifiez le niveau d'huile.\n3. **Démarrage difficile** — Contrôlez le pressostat et le condensateur.\n4. **Bruit excessif** — Inspectez les soupapes et la courroie (Réf: REF-CRR-303).\n\n🔄 **Maintenance préventive** : Vidange recommandée tous les 365 jours."),

            // Courroie
            (new[] { "courroie", "transmission", "usure" },
             "🔧 **Remplacement de Courroie**\n\nProcédure :\n1. **Arrêtez** et consignez la machine (LOTO).\n2. **Relâchez** le tendeur de courroie.\n3. **Retirez** l'ancienne courroie et inspectez les poulies.\n4. **Installez** la nouvelle courroie (Réf: REF-CRR-303).\n5. **Réglez** la tension selon les spécifications (déflexion de 10mm sous 10N).\n6. **Testez** en faisant tourner manuellement avant le démarrage.\n\n⏱️ Durée estimée : 45–60 minutes."),

            // Filtre
            (new[] { "filtre", "huile", "remplacement" },
             "🔧 **Remplacement de Filtre à Huile**\n\nProcédure :\n1. **Arrêtez** l'équipement et attendez 5 minutes.\n2. **Placez** un bac de récupération sous le filtre.\n3. **Dévissez** le filtre usagé (Réf: REF-FHP-101, Stock à vérifier).\n4. **Lubrifiez** le joint du nouveau filtre avec un peu d'huile.\n5. **Vissez** à la main + ¾ de tour supplémentaire.\n6. **Redémarrez** et vérifiez l'absence de fuites.\n\n♻️ Recyclez l'ancien filtre conformément aux normes environnementales."),

            // Joint
            (new[] { "joint", "étanchéité", "fuite" },
             "🔧 **Diagnostic — Problème d'Étanchéité**\n\nSi vous constatez une fuite :\n1. **Identifiez** la source exacte de la fuite.\n2. **Vérifiez** l'état du joint torique (Réf: REF-JNT-202).\n3. **Remplacez** si le joint est aplati, craquelé ou durci.\n4. **Nettoyez** les surfaces de contact avant réassemblage.\n\n⚠️ **Attention** : Le stock de joints REF-JNT-202 est souvent bas — vérifiez la disponibilité avant de planifier l'intervention."),

            // Sécurité / EPI
            (new[] { "sécurité", "epi", "protection", "consignes" },
             "🛡️ **Consignes de Sécurité**\n\n**EPI obligatoires selon le type d'intervention :**\n\n🔧 **Mécanique** : Gants de protection, lunettes, chaussures de sécurité.\n⚡ **Électrique** : Gants isolants, écran facial, tapis isolant, VAT.\n💧 **Hydraulique** : Gants résistants aux huiles, lunettes anti-projections.\n🔥 **Soudure** : Masque de soudeur, tablier ignifugé, gants de soudeur.\n\n📋 **Rappel** : Toujours appliquer la procédure de consignation (LOTO) avant toute intervention sur un équipement sous tension ou en pression."),

            // Maintenance préventive
            (new[] { "préventive", "préventif", "planification", "calendrier" },
             "📅 **Maintenance Préventive**\n\nLes plans de maintenance sont essentiels pour réduire les pannes :\n\n• **Pompe P-200** : Graissage mensuel (tous les 30 jours).\n• **Générateur G-500** : Contrôle trimestriel (tous les 90 jours).\n• **Compresseur C-100** : Vidange annuelle (tous les 365 jours).\n\n💡 **Conseil** : Un taux de complétion préventif > 85% réduit significativement les pannes imprévues. Consultez la page \"Maintenance Préventive\" pour voir les tâches à venir."),

            // Stock / Pièces
            (new[] { "stock", "pièce", "rechange", "réapprovisionnement", "inventaire" },
             "📦 **Gestion des Stocks**\n\nPièces critiques à surveiller :\n• **REF-FHP-101** — Filtre à Huile HP (seuil min: 5 unités)\n• **REF-JNT-202** — Joint d'Étanchéité 50mm (seuil min: 10 unités) ⚠️ Stock souvent bas !\n• **REF-CRR-303** — Courroie de Transmission K-34 (seuil min: 8 unités)\n\n💡 **Conseil** : Consultez la page \"Pièces de Rechange\" pour voir les alertes de stock bas et passez commande avant d'atteindre le seuil critique."),

            // Intervention
            (new[] { "intervention", "créer", "signaler", "panne" },
             "📝 **Créer une Intervention**\n\nPour signaler un problème :\n1. Allez sur la page **Interventions**.\n2. Cliquez sur **\"Créer une intervention\"**.\n3. Remplissez :\n   - **Titre** : Description courte du problème.\n   - **Description** : Détails, symptômes observés.\n   - **Priorité** : Haute (urgence), Normale, ou Basse.\n   - **Équipement** : Sélectionnez la machine concernée.\n4. L'intervention apparaîtra dans la colonne \"En attente\".\n\n🔄 **Workflow** : En attente → Assigné → En cours → Terminé."),

            // Générateur
            (new[] { "générateur", "groupe électrogène", "démarrage" },
             "🔧 **Diagnostic — Générateur Électrique**\n\nProblèmes courants :\n1. **Ne démarre pas** — Vérifiez le niveau de carburant et la batterie.\n2. **Instabilité tension** — Contrôlez le régulateur de tension (AVR).\n3. **Fumée noire** — Filtre à air encrassé ou surcharge.\n4. **Vibrations** — Silent blocs usés ou mauvais alignement.\n\n📋 **Contrôle trimestriel** : Test de démarrage à vide + contrôle niveau fioul."),
        };

        public AiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["AI:OpenApiKey"];
        }

        public async Task<string> GetChatbotResponseAsync(string userMessage)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return await GetSimulatedResponseAsync(userMessage);
            }

            try
            {
                var requestBody = new
                {
                    model = "gpt-3.5-turbo",
                    messages = new[]
                    {
                        new { role = "system", content = "Tu es l'assistant IA de SmartMaintenance, un logiciel de gestion de maintenance (GMAO). Réponds de manière concise et professionnelle en français aux techniciens et managers. Utilise des emojis pour structurer tes réponses." },
                        new { role = "user", content = userMessage }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

                var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(responseString);
                
                var reply = jsonDocument.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content").GetString();

                return reply ?? "Désolé, je n'ai pas pu générer de réponse.";
            }
            catch (Exception ex)
            {
                return $"Erreur de communication avec l'IA : {ex.Message}";
            }
        }

        private Task<string> GetSimulatedResponseAsync(string userMessage)
        {
            var msg = userMessage.Trim();

            // Check exact match in knowledge base first
            foreach (var entry in KnowledgeBase)
            {
                if (msg.Contains(entry.Key, StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(entry.Value);
                }
            }

            // Check topic-based responses by keyword matching
            var bestMatch = TopicResponses
                .Select(t => new { 
                    Topic = t, 
                    Score = t.keywords.Count(k => msg.Contains(k, StringComparison.OrdinalIgnoreCase))
                })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .FirstOrDefault();

            if (bestMatch != null)
            {
                return Task.FromResult(bestMatch.Topic.response);
            }

            // Default response
            return Task.FromResult(
                "🤖 Je n'ai pas trouvé de réponse spécifique à votre question.\n\n" +
                "Voici ce que je peux vous aider à faire :\n" +
                "• **Diagnostic de pannes** — Décrivez un symptôme (ex: \"surchauffe pompe\").\n" +
                "• **Procédures** — Demandez une procédure (ex: \"remplacement courroie\").\n" +
                "• **Sécurité / EPI** — Tapez \"sécurité\" ou \"EPI\".\n" +
                "• **Stocks** — Tapez \"stock\" ou \"pièces de rechange\".\n" +
                "• **Maintenance préventive** — Tapez \"préventive\".\n\n" +
                "💡 Essayez de reformuler votre question avec des mots-clés précis !"
            );
        }
    }
}
