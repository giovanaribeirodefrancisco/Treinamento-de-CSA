import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { getAulaConteudo } from './aula-conteudo';

interface Lesson {
  moduleId: number;
  lessonId: number;
  title: string;
  description: string;
  content: string;
}

interface ModuleLesson {
  id: number;
  title: string;
  active: boolean;
  sublessons?: ModuleLesson[];
}

interface Module {
  id: number;
  title: string;
  lessons: ModuleLesson[];
}

@Component({
  selector: 'app-treino-teo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './treino-teo.component.html',
  styleUrl: './treino-teo.component.scss'
})
export class TreinoTeoComponent implements OnInit {

  menuAberto: boolean = true; // Alterado para true para iniciar com o menu aberto
  currentAulaConteudo: string = '';

  // Dados do menu lateral
  modules: Module[] = [
    {
      id: 1,
      title: 'Introdução à Comunicação Aumentativa e Alternativa',
      lessons: [
        { id: 1, title: 'Orientação 01', active: true},
        { id: 2, title: 'Orientação 02', active: true },
        { id: 3, title: 'Orientação 03', active: true },
        { id: 4, title: 'Referências', active: false }
      ]
    }
  ];

  lessonsData: Lesson[] = [
    {
      moduleId: 1,
      lessonId: 1,
      title: 'Orientação 01',
      description: 'O que é a Comunicação Aumentativa e Alternativa?',
      content: '',
    },
    {
      moduleId: 1,
      lessonId: 2,
      title: 'Orientação 02',
      description: 'O que são Parceiros de Comunicação?',
      content: '',
    },
    {
      moduleId: 1,
      lessonId: 3,
      title: 'Orientação 03',
      description: 'Sobre a Modelagem',
      content: '',
    },
    {
      moduleId: 1,
      lessonId: 4,
      title: 'Referências',
      description: 'Referências Bibliográficas',
      content: '',
    }
  ];

  // Aula atual sendo exibida
  currentLesson: Lesson | undefined;

  constructor() {}

  ngOnInit() {
    // Inicializa com a primeira aula do primeiro módulo
    this.loadLesson(1, 1);
  }

  loadLesson(moduleId: number, lessonId: number): void {
    // Atualizar qual aula está ativa no menu
    this.updateActiveLesson(moduleId, lessonId);

    // Carregar o conteúdo da aula selecionada
    this.currentAulaConteudo = getAulaConteudo(moduleId, lessonId);

    // Encontrar os metadados da aula atual
    this.currentLesson = this.lessonsData.find(
      lesson => lesson.moduleId === moduleId && lesson.lessonId === lessonId
    );

    // Se quiser atualizar metadados para exibição
    if (!this.currentLesson) {
      console.error('Aula não encontrada para:', moduleId, lessonId);
      this.currentLesson = {
        moduleId: moduleId,
        lessonId: lessonId,
        title: 'Aula não encontrada',
        description: 'Conteúdo indisponível',
        content: ''
      };
    }

    /*console.log('Selecionando aula:', moduleId, lessonId);

    // Atualiza o estado de "active" para todas as aulas
    this.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lesson.active = (module.id === moduleId && lesson.id === lessonId);
      });
    });

    // Busca e carrega a aula selecionada
    const lesson = this.lessonsData.find(l =>
      l.moduleId === moduleId && l.lessonId === lessonId);

    if (lesson) {
      this.currentLesson = lesson;
      console.log('Aula carregada:', this.currentLesson);
    } else {
      console.error('Aula não encontrada para:', moduleId, lessonId);
    }*/
  }

  updateActiveLesson(moduleId: number, lessonId: number): void {
    // Desativar todas as aulas
    this.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lesson.active = false;
      });
    });

    // Ativar a aula selecionada
    const moduleIndex = this.modules.findIndex(module => module.id === moduleId);
    if (moduleIndex !== -1) {
      const lessonIndex = this.modules[moduleIndex].lessons.findIndex(lesson => lesson.id === lessonId);
      if (lessonIndex !== -1) {
        this.modules[moduleIndex].lessons[lessonIndex].active = true;
      }
    }
  }

  toggleSidebar() {
    this.menuAberto = !this.menuAberto;
    console.log('Menu aberto:', this.menuAberto);
  }
}
