// ============================================================================
// BIBLIOTECA DE EXERCÍCIOS DOS TREINOS
// ----------------------------------------------------------------------------
// Cada exercício tem: nome, GIF (id do catálogo em data/exercises), instrução
// curta e a duração (que vem de parametrosDeTempo.ts, salvo `segundos` próprio).
//
// - O NOME precisa ser único (o cronômetro identifica o exercício por ele).
// - `gifId` é o id do catálogo (4 dígitos) e precisa existir em
//   data/exercises/rows.json (um teste confere isso).
// - Todos são de BAIXO IMPACTO: sem saltos; em pé, apoiados ou sentados.
// ============================================================================

export type Exercicio = {
  nome: string;
  tipo: "STRENGTH" | "CARDIO";
  /** Id do exercício no catálogo (fornece o GIF). */
  gifId: string;
  /** Uma ou duas frases, para ler rápido durante o treino. */
  instrucao: string;
  /** Repetições aproximadas no tempo de esforço (usado só em estimativas). */
  repeticoesEstimadas: number;
  /** Duração própria em segundos (padrão: segundosDeEsforcoPorExercicio). */
  segundos?: number;
};

export const EXERCICIOS: Record<string, Exercicio> = {
  // ------------------------------------------------------------ pernas e glúteos
  "agachamento-apoio": {
    nome: "Agachamento com apoio",
    tipo: "STRENGTH",
    gifId: "3132",
    instrucao: "Segure numa cadeira ou parede, empurre o quadril para trás e desça só até onde ficar confortável. Suba devagar.",
    repeticoesEstimadas: 10,
  },
  "agachamento-alcance": {
    nome: "Agachamento com alcance",
    tipo: "STRENGTH",
    gifId: "1685",
    instrucao: "Agache sem exagerar na descida. Ao subir, estique os braços para cima.",
    repeticoesEstimadas: 10,
  },
  "rosca-perna": {
    nome: "Rosca de perna em pé",
    tipo: "STRENGTH",
    gifId: "0795",
    instrucao: "Em pé, apoiado se precisar: leve um calcanhar em direção ao glúteo e volte devagar. Alterne as pernas.",
    repeticoesEstimadas: 20,
  },
  "abducao-lateral": {
    nome: "Abdução lateral de quadril",
    tipo: "STRENGTH",
    gifId: "0710",
    instrucao: "Em pé, mãos no quadril: abra uma perna esticada para o lado e volte controlando. Alterne os lados.",
    repeticoesEstimadas: 16,
  },
  panturrilha: {
    nome: "Panturrilha em pé",
    tipo: "STRENGTH",
    gifId: "1373",
    instrucao: "Mãos na parede: suba nas pontas dos pés, segure um instante e desça devagar.",
    repeticoesEstimadas: 20,
  },
  "ponte-gluteo": {
    nome: "Ponte de glúteo",
    tipo: "STRENGTH",
    gifId: "3013",
    instrucao: "Deitado, joelhos dobrados: eleve o quadril apertando o glúteo e desça devagar.",
    repeticoesEstimadas: 12,
  },

  // ------------------------------------------------------------ superiores e core
  "flexao-parede": {
    nome: "Flexão na parede",
    tipo: "STRENGTH",
    gifId: "0659",
    instrucao: "De frente para a parede, mãos na altura dos ombros: dobre os cotovelos levando o peito até ela e empurre de volta, corpo alinhado.",
    repeticoesEstimadas: 12,
  },
  "flexao-inclinada": {
    nome: "Flexão inclinada",
    tipo: "STRENGTH",
    gifId: "3785",
    instrucao: "Mãos numa bancada firme, corpo reto: desça o peito até a borda e empurre de volta.",
    repeticoesEstimadas: 8,
  },
  "remada-toalha": {
    nome: "Remada com toalha",
    tipo: "STRENGTH",
    gifId: "3165",
    instrucao: "Segure uma toalha esticada à frente, incline levemente o tronco com as costas retas e puxe-a ao peito juntando as escápulas.",
    repeticoesEstimadas: 12,
  },
  "elevacao-pernas-sentado": {
    nome: "Elevação de pernas sentado",
    tipo: "STRENGTH",
    gifId: "0689",
    instrucao: "Sentado na beira de um banco, mãos de apoio: estenda as pernas à frente e baixe devagar.",
    repeticoesEstimadas: 10,
  },
  "inclinacao-pelvica": {
    nome: "Inclinação pélvica em pé",
    tipo: "STRENGTH",
    gifId: "1364",
    instrucao: "Em pé, joelhos levemente flexionados: incline a pelve para frente e para trás contraindo o abdômen.",
    repeticoesEstimadas: 12,
  },
  "arqueiro-em-pe": {
    nome: "Arqueiro em pé",
    tipo: "CARDIO",
    gifId: "3669",
    instrucao: "Em pé, braços à frente: gire o tronco abrindo um braço para trás, como quem puxa um arco. Alterne os lados.",
    repeticoesEstimadas: 14,
  },

  // ------------------------------------------------------------ cardio de baixo impacto
  "marcha-acelerada": {
    nome: "Marcha acelerada",
    tipo: "CARDIO",
    gifId: "3636",
    instrucao: "De frente para a parede, mãos de apoio: suba os joelhos alternadamente em ritmo forte, sem saltar.",
    repeticoesEstimadas: 40,
  },
  "marcha-estatica": {
    nome: "Marcha estática",
    tipo: "CARDIO",
    gifId: "3636",
    instrucao: "Marche no lugar em ritmo leve, apoiado se precisar, respirando de forma ritmada para recuperar o fôlego.",
    repeticoesEstimadas: 40,
  },

  // ------------------------------------------------------------ mobilidade e alongamento
  "alongamento-lateral": {
    nome: "Alongamento lateral em pé",
    tipo: "STRENGTH",
    gifId: "0794",
    instrucao: "Em pé, braços abertos: incline o tronco para um lado e depois para o outro, sem forçar.",
    repeticoesEstimadas: 10,
  },
  "alongamento-peito": {
    nome: "Abertura de peito",
    tipo: "STRENGTH",
    gifId: "1167",
    instrucao: "Braços abertos na altura dos ombros: traga-os à frente, cruzando, e abra de novo sentindo o peito alongar.",
    repeticoesEstimadas: 10,
  },
  "alongamento-costas": {
    nome: "Alongamento das costas",
    tipo: "STRENGTH",
    gifId: "1365",
    instrucao: "Entrelace os dedos, gire as palmas para fora e eleve os braços acima da cabeça, alongando as costas.",
    repeticoesEstimadas: 8,
  },
  "alongamento-pescoco": {
    nome: "Alongamento do pescoço",
    tipo: "STRENGTH",
    gifId: "1403",
    instrucao: "Incline a orelha em direção ao ombro, sem forçar. Troque de lado na metade do tempo.",
    repeticoesEstimadas: 2,
  },
  "alongamento-triceps": {
    nome: "Alongamento de tríceps",
    tipo: "STRENGTH",
    gifId: "0817",
    instrucao: "Um braço acima da cabeça, cotovelo dobrado: puxe o cotovelo com a outra mão. Troque de lado na metade do tempo.",
    repeticoesEstimadas: 2,
  },
  "alongamento-panturrilha": {
    nome: "Alongamento de panturrilha na parede",
    tipo: "STRENGTH",
    gifId: "1377",
    instrucao: "Mãos na parede, uma perna atrás com o calcanhar no chão: incline-se à frente. Troque de perna na metade do tempo.",
    repeticoesEstimadas: 2,
  },
  "alongamento-posterior-cadeira": {
    nome: "Alongamento de coxa na cadeira",
    tipo: "STRENGTH",
    gifId: "1548",
    instrucao: "Sentado na beira da cadeira, estenda uma perna com o calcanhar no chão e incline-se levemente. Troque de perna na metade do tempo.",
    repeticoesEstimadas: 2,
  },
  "circulos-tornozelo": {
    nome: "Círculos de tornozelo",
    tipo: "STRENGTH",
    gifId: "1368",
    instrucao: "Sentado, estenda uma perna e gire o tornozelo em círculos. Troque o sentido e a perna na metade do tempo.",
    repeticoesEstimadas: 10,
  },
};
