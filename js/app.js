/*  Module Pattern. La arquitectura del proyecto está basada en un patrón de módulos:
*   Data module, UI module y Controller module.
*   Nota: usamos IIFE para cada módulo. Esto es similar a la encapsulación de java, ya que nos permite proteger los datos de forma privada.
**/

/*******************************************
**  Controlador del presupuesto (budget)  **
*******************************************/
var budgetController = (function() {
    // PARTE PRIVADA
    // Constructor gastos
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    // Constructor porcentaje
    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    // Getter del porcentaje
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    // Constructor ingresos
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    /*  Almacenamos todos los gastos/ingresos en vectores dentro de un objeto llamado 'data'. Este, a su vez,
    *   contine la suma total de ingresos y de gastos, como el resultado final del presupuesto y el porcentaje,
    *   además de ser el propio constructor de cada uno (por eso están inicializados a '0').
    *
    *   var allExpenses = [];
    *   var allIncomes = [];
    *   var totalExpenses = 0;
    *   Nota: Esto no es una manera correcta de hacer las cosas. Es mejor almacenar todo en un
    *   gran objeto que contenga todos los datos. ¡DATA STRUCTURE!
    **/
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }

    // Método que suma todos los gastos e ingresos totales, usando un forEach
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });
        data.totals[type] = sum;
    };

    // PARTE PÚBLICA
    return {
        addItemm: function(type, desc, val) {
            var newItem, id;

            //[1 2 3 4 5], siguiente ID = 6
            //[1 2 4 6 8], ¿...?, siguiente ID = 9
            //ID = último ID + 1
            // 1. Crea un nuevo ID
            if (data.allItems[type].length > 0) {
                id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                id = 0;
            }
            
            // 2. Crea un nuevo elemento basado en ingresos (inc) o en gastos (exp)
            if (type === 'exp') {
                newItem = new Expense(id, desc, val);
            } else if (type === 'inc') {
                newItem = new Income(id, desc, val);
            }

            // 3. Almacena el elemento por el final del vector data, ya que usa push()
            data.allItems[type].push(newItem);

            // 4. Devuelve el nuevo elemento
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;
            /*  Debemos de borrar por el id del elemento, lo que pasa es que aquí se intercalan los id's, tanto en gastos como en ingresos.
            *   La solución es crear un vector auxiliar y almacenar todos los id's ahí, para buscar el elemento a borrar y que coincida con el id objetivo.
            *   ej.:
            *   data.allItems[type][id]; no nos sirve
            *   id = 6 -> ids = [1 2 4 6 8] -> index = 3
            **/

            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1); // splice, empieza por el número index y borra 1 elemento
            }
        },

        calculateBudget: function() {
            // 1. Calcular la suma total de todos los ingresos y gastos
            calculateTotal('exp');
            calculateTotal('inc');

            // 2. Calcular el presupuesto: ingresos - gastos
            data.budget = data.totals.inc - data.totals.exp;

            // 3. Calcular el porcentaje de los ingresos que gastamos
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {
            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },

        // Nota: forEach() y map() son similares. Con map puedes devolver datos y almacenarlos en una variable, mientras que con el forEach no.
        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });
            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function() {
            console.log(data); 
        }
    };

})();


/********************************************
**  Controlador de la interfaz de usuario  **
********************************************/
var UIController = (function() {
    
    // Almacenamos en la parte privada de UIController todas las strings que se van a usar como querySelector
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
        container: '.container'
    };

    var formatNumber = function(num, type) {
        // reglas: '+' o '-' antes del número, dos decimales y la coma separando los millares. Ej.: 2310.4567 -> + 2,310.46
        var numSplit, int, dec, type;

        num = Math.abs(num); // Pasamos el número a un valor absoluto
        num = num.toFixed(2); // Añadimos al número dos decimales y redondea automáticamente
        numSplit = num.split('.');
        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length); // input 52310 -> output 52,310
        }

        dec = numSplit[1];
        
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    // Función usada en el método displayPercentages de la parte pública. Es la primera parte del siguiente método
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    // Closures - Parte pública
    return {
        getInpunt: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // Puede ser ingresos o gastos
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value) // Corregimos que value sea una string y no number
            }
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;

            // 1. Crear una string HTML para el placeholder
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // 2. Reemplazar el placeholder por los datos reales
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // 3. Insertar el código HTML en el DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
            /*  Lo que hace insertAdjacentHTML es insertar el código HTML embebido justo después(before end) del elemento incomeContainer y expensesContainer,
            *   que son '.income__list' y 'expenses__list', respectivamente.
            **/
        },

        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
            // Like this: https://blog.garstasio.com/you-dont-need-jquery/dom-manipulation/#dom-api-7
        },

        clearFields: function() {
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);
            /*  Esto es una parra para parsear fields. Como es una string, no se puede parsear, por lo que primero lo pasamos a Array, mediante prototype y luego
            *   lo separamos con el método nativo slice(). El call es para que introducir la variable 'this' y que fields sean dos instancias distintas independientes.
            *   Todo esto se podría haber hecho haciendo dos querySelectors aparte con diferente nombre de variable. Pero es para ahorrar código y enseñar filigranas.
            **/

            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });

            // Esto es para que, una vez haya borrado los campos, haga :focus en el primer elemento
            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            if (obj.budget == 0) {
                document.querySelector(DOMstrings.budgetLabel).textContent = "0.00";
            } else {
                document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            }
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
        
            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '-';
            }
        },

        /*  Aquí vamos a usar un querySelectorAll para seleccionar todas las clases que sean '.item__percentage', ya que
        *   les vamos a añadir el porcentaje. A continuación hemos creado un bucle for que pasa todos los elementos del DOM que se tienen
        *   que poner los porcentajes(list=fields) y le pasamos una función callback. En dicha función, pasamos el valor actual(current) y
        *   su índice (index). De esta forma, si el porcentaje pasado es mayor que '0' le dará el valor, y si no el símbolo '-'
        **/
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            // Llamamos al método de la parte privada
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '-';
                }
            });
            /* Es lo mismo que esto:
            function nodeList(list=fields=current, index) {
                for(var i in fields) {
                    if(percentages[index] > 0) {
                        fields[i].textContent = percentages[index] + '%';
                    } else {
                        fields[i].textContent = '-';
                    }
                }
            }*/

        },

        displayMonth: function() {
            var now, month, months, year;
            
            now = new Date();
            //var christmas = new Date(2019, 12, 25);

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' +year;
        },

        changedType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );

            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        getDOMstrings: function() {
            return DOMstrings;
        }
    };
})();


/***********************************
**  Controlador global de la app  **
***********************************/
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings(); // Llamada a las querySelectors en UIController

        // EventListener que se activa al hacer click al botón de añadir.
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        // EventListener que se activa al pulsar ENTER (keyCode = 13) - http://keycodes.atjayjo.com/
        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        // Event delegation. Event bubbling up - Por eso usamos '.container'
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    var updateBudget = function() {
        // 1. Calcular el presupuesto
        budgetCtrl.calculateBudget();

        // 2. Devolver el presupuesto
        var budget = budgetCtrl.getBudget();

        // 3. Mostrar por pantalla el presupuesto
        UICtrl.displayBudget(budget);
        
    };

    var updatePercentages = function() {
        // 1. Calcular los porcentajes
        budgetCtrl.calculatePercentages();

        // 2. Leer los porcentajes desde budgetController
        var percentages = budgetCtrl.getPercentages();

        // 3. Actualizar los porcentajes y mostrarlos por pantalla
        UICtrl.displayPercentages(percentages);
    };

    var ctrlAddItem = function() {
        var input, newItem;
        
        // 1. Coger los datos introducidos por pantalla
        input = UICtrl.getInpunt();
        
        // Filtramos las entradas incorrectas por pantalla (descripción en blanco, not a number y número negativos)
        if(input.description !== "" && !isNaN(input.value) && input.value > 0) { 
            // 2. Añadir el elemento al budgetController
            newItem = budgetCtrl.addItemm(input.type, input.description, input.value);

            // 3. Añadir el elemento a la UI
            UICtrl.addListItem(newItem, input.type);
            // 4. Limpiar los campos de entrada
            UICtrl.clearFields();

            // 5. Calcular y actualizar el presupuesto
            updateBudget();

            // 6. Calcular y actualizar los porcentajes
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; 
        /*  Esto es para averiguar el id del gasto/ingreso. Para ello, lanzamos un evento al pulsar haciendo click (event.target) y luego saltamos de padre
        *   en padre del elemento target (usando parentNode) hasta llegar a la raíz padre, que es "<div class="item clearfix" id="income-0">", obteniendo
        *   el id = income-0, en este caso. Como podemos observar, desde <i> hasta <div> raíz se han hecho cuatro saltos de padre en padre.
        **/
        if (itemID) {
            
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]); // convertimos el ID de string a int, porque en budgetCtrl.deleteIrem no funcionaba

            // 1. Eliminar el elemento de la estructura de datos
            budgetCtrl.deleteItem(type, ID);

            // 2. Eliminar el elemento de la interfaz de usuario
            UICtrl.deleteListItem(itemID);

            // 3. Actualizar y mostrar el nuevo presupuesto
            updateBudget();

            // 4. Calcular y actualizar los porcentajes
            updatePercentages();
        }
    };

    // Closures - Parte pública
    return {
        init: function() {
            console.log('Application has started.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, UIController);

// Inicializamos los parámetros del controlador global y lanzamos la aplicación
controller.init();