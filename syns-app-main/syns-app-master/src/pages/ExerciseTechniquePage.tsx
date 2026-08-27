import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exercises, categories, type CategoryId } from '../data/exercises';
import { Activity, ArrowLeft, ChevronLeft, Dumbbell, Footprints, Hand, MoveRight, ShieldAlert, Sparkles, Target } from 'lucide-react';
import './ExerciseTechniquePage.css';

const CATEGORY_ICONS = {
  chest: Activity,
  back: ArrowLeft,
  legs: Footprints,
  shoulders: MoveRight,
  arms: Hand,
  abs: Target,
} as const;

export default function ExerciseTechniquePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Автоматическое открытие упражнения при наличии exerciseId в URL
  useEffect(() => {
    if (exerciseId) {
      // Найти упражнение по id
      const exercise = exercises.find(e => e.id === exerciseId);
      if (exercise) {
        setSelectedCategory(exercise.category);
        setSelectedExerciseId(exercise.id);
      }
    }
  }, [exerciseId]);

  const handleCategoryClick = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    setSelectedExerciseId(null);
  };

  const handleExerciseClick = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedExerciseId(null);
  };

  const handleBackToList = () => {
    setSelectedExerciseId(null);
  };

  const handleAddToProgram = () => {
    alert('Функция добавления в программу будет реализована в ближайшее время!');
  };

  const selectedExercise = selectedExerciseId
    ? exercises.find(e => e.id === selectedExerciseId)
    : null;

  const filteredExercises = selectedCategory
    ? exercises.filter(e => e.category === selectedCategory)
    : [];

  // Детальный просмотр упражнения
  if (selectedExercise) {
    return (
      <div className="exercise-technique-page">
        <div className="exercise-detail">
          <div className="flex items-center gap-2 mb-4">
            <button 
              className="back-button" 
              onClick={() => navigate('/plan')}
              title="Вернуться к программе тренировок"
            >
              <ChevronLeft className="inline-block" size={16} /> Назад к программе
            </button>
          </div>
          
          <div className="exercise-header">
            <h1>{selectedExercise.name}</h1>
            <span className="category-badge">
              {(() => {
                const Icon = CATEGORY_ICONS[selectedExercise.category] || Dumbbell;
                return <Icon size={16} />;
              })()}{' '}
              {categories.find(c => c.id === selectedExercise.category)?.name}
            </span>
          </div>

          <div className="exercise-content">
            <div className="exercise-image-placeholder">
              {selectedExercise.image ? (
                <img src={selectedExercise.image} alt={selectedExercise.name} />
              ) : (
                <div className="no-image">Изображение скоро появится</div>
              )}
            </div>

            <div className="exercise-description">
              <h2>Описание</h2>
              <p>{selectedExercise.description}</p>
            </div>

            <div className="exercise-steps">
              <h2>Техника выполнения</h2>
              <ol>
                {selectedExercise.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="exercise-mistakes">
              <h2><ShieldAlert size={18} className="inline-block" /> Частые ошибки</h2>
              <ul>
                {selectedExercise.common_mistakes.map((mistake, index) => (
                  <li key={index}>{mistake}</li>
                ))}
              </ul>
            </div>

            <div className="exercise-breathing">
              <h2><Sparkles size={18} className="inline-block" /> Дыхание</h2>
              <p>{selectedExercise.breathing}</p>
            </div>

            <button className="add-to-program-btn" onClick={handleAddToProgram}>
              <Dumbbell size={16} className="inline-block mr-2" /> Добавить в программу
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Список упражнений категории
  if (selectedCategory) {
    return (
      <div className="exercise-technique-page">
        <div className="exercises-list">
          <button className="back-button" onClick={handleBackToCategories}>
            <ChevronLeft className="inline-block" size={16} /> Назад к категориям
          </button>
          
          <h1>
            {(() => {
              const Icon = CATEGORY_ICONS[selectedCategory] || Dumbbell;
              return <Icon size={20} />;
            })()}{' '}
            {categories.find(c => c.id === selectedCategory)?.name}
          </h1>
          
          <div className="exercises-grid">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                className="exercise-card"
                onClick={() => handleExerciseClick(exercise.id)}
              >
                <div className="exercise-card-image">
                  {exercise.image ? (
                    <img src={exercise.image} alt={exercise.name} />
                  ) : (
                    <div className="card-placeholder"><Dumbbell size={32} /></div>
                  )}
                </div>
                <h3>{exercise.name}</h3>
                <p className="exercise-short-desc">
                  {exercise.description.substring(0, 80)}...
                </p>
                <button className="view-details-btn">Подробнее</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Выбор категории
  return (
    <div className="exercise-technique-page">
      <div className="categories-container">
        <h1>Техника упражнений</h1>
        <p className="page-subtitle">Выберите группу мышц для просмотра упражнений</p>
        
        <div className="categories-grid">
          {categories.map(category => {
            const exerciseCount = exercises.filter(e => e.category === category.id).length;
            const Icon = CATEGORY_ICONS[category.id as keyof typeof CATEGORY_ICONS] || Dumbbell;
            return (
              <div
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="category-icon"><Icon size={32} /></div>
                <h3>{category.name}</h3>
                <p className="exercise-count">{exerciseCount} упражнений</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
